"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react";
import {
  BookOpen,
  Search,
  Plus,
  X,
  Pencil,
  Check,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Link2,
  ExternalLink,
  ShieldCheck,
  CalendarClock,
  Sparkles,
  Send,
  Table2,
  Loader2,
  RefreshCw,
  Bot,
  History,
  Upload,
  Trash2,
  Paperclip,
  FileText,
} from "lucide-react";
import {
  Panel,
  Button,
  Pill,
  EmptyState,
  Skeleton,
  Eyebrow,
} from "@/components/ui/kit";
import { usePaged, PagedBar } from "@/components/ui/paged";
import { jsonrepair } from "jsonrepair";

// ── Types ─────────────────────────────────────────────────
type MemType =
  | "fact"
  | "preference"
  | "decision"
  | "event"
  | "project"
  | "contact"
  | "lesson"
  | "metric"
  | "note"
  | "document"
  | "reference"
  | "catatan"
  | "fakta"
  | "cycle";
type MemStatus = "active" | "superseded" | "archived";

interface Entry {
  id: string;
  path: string;
  type: MemType;
  title: string;
  status: MemStatus;
  confidence: number | null;
  provenance: string | null;
  tags: string[];
  links: string[];
  files?: string[];
  body: string;
  validFrom: string | null;
  validTo: string | null;
  updatedAt: string;
  syncedAt: string;
  source?: "wiki" | "workspace" | "vault";
  domain?: string;
  project?: string | null;
  sensitif?: string;
  perkara?: string;
  kelas_bukti?: string;
  halaman?: string;
  attest?: string | null;
  keputusan?: string | null;
}

interface MemoryResponse {
  entries: Entry[];
  domainCounts?: Record<string, number>;
  projectCounts?: Record<string, number>;
  typeCounts: Record<string, number>;
  statusCounts?: Record<string, number>;
  total: number;
  lastSync: string | null;
}

type Scope = "all" | "wiki" | "workspace" | "vault" | "archive";

// ── Ask Librarian types ───────────────────────────────────
interface AskTable {
  title: string;
  columns: string[];
  rows: string[][];
}
interface AskSource {
  title: string;
  url: string;
  rank?: number;
  relevance?: string;
}
interface AskResult {
  answer: string;
  tables: AskTable[];
  sources: AskSource[];
}

const TYPES: MemType[] = [
  "fact",
  "preference",
  "decision",
  "event",
  "project",
  "contact",
  "lesson",
  "metric",
  "note",
  "document",
  "reference",
];

// Label tampilan utk slug (domain/project): fleet_test → Fleet Test
function cleanLabel(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

type Tone = "neutral" | "up" | "down" | "warn" | "accent";
function typeTone(t: string): Tone {
  if (t === "decision") return "accent";
  if (t === "lesson") return "warn";
  if (t === "project" || t === "cycle") return "up";
  return "neutral";
}

// ── Helpers ───────────────────────────────────────────────
function timeAgo(d: string | null): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (Number.isNaN(diff)) return "—";
  const s = Math.floor(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  return `${mo}mo ago`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

// Ambil objek JSON pertama dari teks hasil agent (toleran markdown fence, teks
// tambahan, trailing "STATUS: ..." dari bridge). Kalau JSON mentah gagal di-parse,
// coba jsonrepair (memperbaiki koma ganda, kutip tak ter-escape, dsb).
function parseJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  const candidate = cleaned.slice(start, end + 1);
  let obj: unknown = null;
  try {
    obj = JSON.parse(candidate);
  } catch {
    try {
      obj = JSON.parse(jsonrepair(candidate));
    } catch {
      return null;
    }
  }
  if (typeof obj !== "object" || obj === null) return null;
  return obj as Record<string, unknown>;
}

// Parse hasil Ask Librarian → struktur tabel/sumber.
function parseAskResult(text: string): AskResult | null {
  const o = parseJsonObject(text);
  if (!o) return null;
  const tables = Array.isArray(o.tables)
    ? o.tables
        .filter((t: unknown) => t && typeof t === "object")
        .map((t) => ({
          title: String((t as AskTable).title || "Tabel"),
          columns: Array.isArray((t as AskTable).columns)
            ? (t as AskTable).columns.map(String)
            : [],
          rows: Array.isArray((t as AskTable).rows)
            ? (t as AskTable).rows.map((r) => (Array.isArray(r) ? r.map(String) : []))
            : [],
        }))
    : [];
  const sources = Array.isArray(o.sources)
    ? o.sources
        .filter((s: unknown) => s && typeof s === "object")
        .map((s) => ({
          title: String((s as AskSource).title || ""),
          url: String((s as AskSource).url || ""),
          rank: Number((s as AskSource).rank ?? 0),
          relevance: String((s as AskSource).relevance || ""),
        }))
        .filter((s: AskSource) => s.url)
    : [];
  return {
    answer: String(o.answer || ""),
    tables,
    sources,
  };
}

// Parse hasil Kurasi Proposa → struktur workflow librarian+custodian.
function parseProposeResult(text: string): ProposeResult | null {
  const o = parseJsonObject(text);
  if (!o) return null;
  const cust = (o.custodian && typeof o.custodian === "object"
    ? (o.custodian as Record<string, unknown>)
    : {}) as { verdict?: string; catatan_verifikasi?: string };
  const revisi = Array.isArray(o.revisi)
    ? o.revisi
        .filter((r: unknown) => r && typeof r === "object")
        .map((r) => ({
          item: String((r as { item?: string }).item || ""),
          perbaikan: String((r as { perbaikan?: string }).perbaikan || ""),
        }))
        .filter((r: { item: string }) => r.item)
    : [];
  const sources = Array.isArray(o.sources)
    ? o.sources
        .filter((s: unknown) => s && typeof s === "object")
        .map((s) => ({
          title: String((s as { title?: string }).title || ""),
          url: String((s as { url?: string }).url || ""),
        }))
        .filter((s: { url: string }) => s.url)
    : [];
  return {
    summary: String(o.summary || ""),
    verdict: String(o.verdict || ""),
    vaultPath: String(o.vaultPath || ""),
    promoted: Boolean(o.promoted),
    wikiPath: String(o.wikiPath || ""),
    custodian: {
      verdict: String(cust.verdict || ""),
      catatan_verifikasi: String(cust.catatan_verifikasi || ""),
    },
    revisi,
    sources,
  };
}

// ── Confidence dot ────────────────────────────────────────
function confidenceMeta(c: number): { label: string; color: string } {
  // Accept 0–1 or 0–100 scales.
  const v = c > 1 ? c / 100 : c;
  if (v >= 0.75) return { label: "high confidence", color: "var(--up)" };
  if (v >= 0.4) return { label: "medium confidence", color: "var(--warn)" };
  return { label: "low confidence", color: "var(--down)" };
}

function ConfidenceDot({ value }: { value: number }) {
  const { label, color } = confidenceMeta(value);
  return (
    <span
      className="inline-flex items-center gap-1.5 num text-[10.5px] text-[var(--text-3)]"
      title={label}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// ── Tiny, safe markdown renderer (builds React elements) ──
// Handles: # / ## headings, - / * bullets, - [ ] / - [x] checkboxes,
// blank-line spacing, paragraphs, and inline `code`.
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`") && p.length > 1) {
      return (
        <code
          key={`${keyBase}-c${i}`}
          className="num text-[12.5px] px-1.5 py-0.5 rounded-[5px] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)]"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyBase}-t${i}`}>{p}</Fragment>;
  });
}

function Markdown({ body }: { body: string }) {
  const lines = (body || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: { text: string; check: boolean | null }[] = [];
  let key = 0;

  const flushBullets = () => {
    if (!bullets.length) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`ul-${key++}`} className="my-1.5 space-y-1">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[13.5px] leading-relaxed text-[var(--text-2)]"
          >
            {it.check === null ? (
              <span className="mt-[9px] w-1 h-1 rounded-full bg-[var(--text-3)] shrink-0" />
            ) : (
              <span
                className="mt-[2px] w-3.5 h-3.5 rounded-[4px] border shrink-0 flex items-center justify-center"
                style={{
                  borderColor: it.check ? "var(--up)" : "var(--line-strong)",
                  background: it.check
                    ? "color-mix(in srgb, var(--up) 16%, transparent)"
                    : "transparent",
                }}
              >
                {it.check && (
                  <Check className="w-2.5 h-2.5" style={{ color: "var(--up)" }} />
                )}
              </span>
            )}
            <span className={it.check ? "opacity-70" : ""}>
              {renderInline(it.text, `li-${key}-${i}`)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const checkM = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    const bulletM = line.match(/^\s*[-*]\s+(.*)$/);

    if (checkM) {
      bullets.push({ text: checkM[2], check: checkM[1].toLowerCase() === "x" });
      continue;
    }
    if (bulletM) {
      bullets.push({ text: bulletM[1], check: null });
      continue;
    }
    flushBullets();

    if (line.startsWith("## ")) {
      blocks.push(
        <h4
          key={`h-${key++}`}
          className="mt-3 mb-1 text-[13px] font-semibold tracking-[-0.01em] text-[var(--text)]"
        >
          {renderInline(line.slice(3), `h2-${key}`)}
        </h4>
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h3
          key={`h-${key++}`}
          className="mt-3 mb-1 text-[15px] font-semibold tracking-[-0.015em] text-[var(--text)]"
        >
          {renderInline(line.slice(2), `h1-${key}`)}
        </h3>
      );
    } else if (line.trim() === "") {
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
    } else {
      blocks.push(
        <p
          key={`p-${key++}`}
          className="text-[13.5px] leading-relaxed text-[var(--text-2)]"
        >
          {renderInline(line, `p-${key}`)}
        </p>
      );
    }
  }
  flushBullets();

  if (!blocks.length) {
    return (
      <p className="text-[13px] text-[var(--text-3)] italic">No content.</p>
    );
  }
  return <div className="space-y-0.5">{blocks}</div>;
}

// ── Entry card ────────────────────────────────────────────
function EntryCard({
  entry,
  expanded,
  onToggle,
  onEdit,
}: {
  entry: Entry;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const isFolder = entry.path.endsWith("/");
  const fileUrl =
    entry.source === "wiki"
      ? `/api/information-library/file?root=wiki&path=${encodeURIComponent(entry.path)}`
      : `/api/information-library/file?root=workspace&path=${encodeURIComponent(entry.path)}`;
  return (
    <Panel className="p-0 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full text-left px-5 py-4 flex items-start gap-3 cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Pill tone={typeTone(entry.type)}>{entry.type}</Pill>
            {entry.domain && (
              <Pill tone="accent">{cleanLabel(entry.domain)}</Pill>
            )}
            {entry.project && (
              <Pill tone="up">
                <FolderOpen className="w-3 h-3" />
                {cleanLabel(entry.project)}
              </Pill>
            )}
            {entry.source && (
              <Pill
                tone={
                  entry.source === "workspace"
                    ? "accent"
                    : entry.source === "vault"
                    ? "warn"
                    : "neutral"
                }
              >
                {entry.source === "vault"
                  ? "vault"
                  : entry.source === "workspace"
                  ? "workspace"
                  : "wiki"}
              </Pill>
            )}
            {entry.source === "vault" ? (
              <Pill tone="neutral">{entry.status}</Pill>
            ) : (
              entry.status !== "active" && <Pill tone="neutral">{entry.status}</Pill>
            )}
            {entry.source === "vault" && entry.sensitif === "ya" && (
              <Pill tone="down">sensitif</Pill>
            )}
            {entry.confidence != null && (
              <ConfidenceDot value={entry.confidence} />
            )}
          </div>
          <h3 className="text-[15px] font-medium text-[var(--text)] leading-snug truncate">
            {entry.title}
          </h3>
          {entry.path && (
            <p className="flex items-center gap-1.5 mt-1.5 min-w-0">
              {!isFolder ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Buka file asli"
                  className="flex items-center gap-1.5 min-w-0 text-[10.5px] font-mono text-[var(--text-4)] hover:text-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{entry.path}</span>
                </a>
              ) : (
                <span className="text-[10.5px] font-mono text-[var(--text-4)] truncate">{entry.path}</span>
              )}
            </p>
          )}
          {isFolder && entry.files && entry.files.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex flex-wrap gap-1.5">
                {entry.files.slice(0, 30).map((f) => (
                  <a
                    key={f}
                    href={`/api/information-library/file?root=workspace&path=${encodeURIComponent(f)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Buka file pendukung"
                    className="flex items-center gap-1 min-w-0 max-w-full text-[10.5px] font-mono text-[var(--text-3)] hover:text-[var(--accent)] transition-colors rounded-full px-2 py-1 bg-[var(--surface-2)] border border-[var(--line)]"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{f.replace(/^docs\/[^/]+\//, "")}</span>
                  </a>
                ))}
              </div>
              {entry.files.length > 30 && (
                <span className="num text-[10.5px] text-[var(--text-4)]">
                  … dan {entry.files.length - 30} file lain
                </span>
              )}
            </div>
          )}
          {entry.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {entry.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="num text-[10.5px] text-[var(--text-3)] rounded-full px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--line)]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="num text-[10.5px] text-[var(--text-3)]">
            {timeAgo(entry.updatedAt)}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-3)] transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-1">
          <div className="rule mb-4" />
          <Markdown body={entry.body} />

          {/* Metadata */}
          <div className="mt-5 flex flex-col gap-2.5">
            {entry.provenance && (
              <div className="flex items-center gap-2 text-[11.5px] text-[var(--text-3)]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  source{" "}
                  <span className="text-[var(--text-2)]">{entry.provenance}</span>
                </span>
              </div>
            )}
            {(entry.validFrom || entry.validTo) && (
              <div className="flex items-center gap-2 num text-[11.5px] text-[var(--text-3)]">
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  valid {fmtDate(entry.validFrom)}
                  {" → "}
                  {entry.validTo ? fmtDate(entry.validTo) : "present"}
                </span>
              </div>
            )}
            {entry.links.length > 0 && (
              <div className="flex items-start gap-2 text-[11.5px] text-[var(--text-3)]">
                <Link2 className="w-3.5 h-3.5 shrink-0 mt-1" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {entry.links.map((l) => (
                    <span
                      key={l}
                      className="num text-[10.5px] text-[var(--text-2)] rounded-full px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--line)]"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {entry.source === "vault" && (
              <div className="flex flex-col gap-1.5 text-[11.5px] text-[var(--text-3)]">
                {entry.sensitif === "ya" && (
                  <span className="text-[var(--down)]">
                    ⚠ sensitif — wajib persetujuan user sebelum terbit
                  </span>
                )}
                {entry.perkara && (
                  <span>
                    perkara: <span className="text-[var(--text-2)]">{entry.perkara}</span>
                  </span>
                )}
                {entry.kelas_bukti && (
                  <span>
                    kelas bukti: <span className="text-[var(--text-2)]">{entry.kelas_bukti}</span>
                  </span>
                )}
                {entry.halaman && (
                  <span>
                    halaman: <span className="num text-[var(--text-2)]">{entry.halaman}</span>
                  </span>
                )}
                {entry.attest && (
                  <span>
                    attest: <span className="text-[var(--text-2)]">{entry.attest}</span>
                  </span>
                )}
                {entry.keputusan && (
                  <span>
                    keputusan: <span className="text-[var(--text-2)]">{entry.keputusan}</span>
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 num text-[11px] text-[var(--text-4)]">
              <span>{entry.path}</span>
            </div>
          </div>

          <div className="mt-5">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Edit / New slide-over ─────────────────────────────────
interface Draft {
  id?: string;
  path?: string;
  title: string;
  type: MemType;
  tags: string;
  status: MemStatus;
  confidence: string;
  body: string;
  sensitif: string;
  perkara: string;
  sumber: string;
  halaman: string;
  kelas_bukti: string;
}

function emptyDraft(): Draft {
  return {
    title: "",
    type: "note",
    tags: "",
    status: "active",
    confidence: "",
    body: "",
    sensitif: "tidak",
    perkara: "",
    sumber: "",
    halaman: "",
    kelas_bukti: "sekunder",
  };
}

function draftFrom(e: Entry): Draft {
  return {
    id: e.id,
    path: e.path,
    title: e.title,
    type: e.type,
    tags: e.tags.join(", "),
    status: e.status,
    confidence: e.confidence != null ? String(e.confidence) : "",
    body: e.body,
    sensitif: e.sensitif === "ya" ? "ya" : "tidak",
    perkara: e.perkara || "",
    sumber: e.provenance || "",
    halaman: e.halaman || "",
    kelas_bukti: e.kelas_bukti || "sekunder",
  };
}

function EntryEditor({
  draft,
  isNew,
  onClose,
  onSaved,
}: {
  draft: Draft;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!d.title.trim() || busy) return;
    setBusy(true);
    const tags = d.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const confNum = d.confidence.trim() ? Number(d.confidence) : null;
    const body: Record<string, unknown> = {
      id: d.id,
      path: d.path,
      type: d.type,
      title: d.title.trim(),
      body: d.body,
      tags,
      status: d.status,
      confidence: Number.isFinite(confNum as number) ? confNum : null,
      sensitif: d.sensitif,
      perkara: d.perkara.trim() || undefined,
      sumber: d.sumber.trim() || undefined,
      halaman: d.halaman.trim() || undefined,
      kelas_bukti: d.kelas_bukti,
    };
    try {
      const r = await fetch("/api/brahma/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => {
          onSaved();
        }, 2000);
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] px-3.5 py-2.5 rounded-[10px] border border-[var(--line)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors";
  const labelCls =
    "block eyebrow !mb-2";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: "blur(2px)" }}
      />
      <div className="elevated relative w-full max-w-md h-full overflow-y-auto p-6 animate-[hq-rise_0.3s_ease]">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Eyebrow>{isNew ? "Library proposal" : "Library correction"}</Eyebrow>
            <h2 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
              {isNew ? "Usulkan ke librarian" : "Koreksi lewat librarian"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost inline-flex items-center justify-center w-9 h-9 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div
              className="mb-4 w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "color-mix(in srgb, var(--up) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--up) 30%, transparent)",
              }}
            >
              <Check className="w-6 h-6" style={{ color: "var(--up)" }} />
            </div>
            <p className="text-[15px] font-medium text-[var(--text)]">
              Dikirim ke librarian untuk kurasi
            </p>
            <p className="mt-1.5 text-[12.5px] text-[var(--text-3)] max-w-xs">
              Librarian akan memverifikasi provenans, dedup terhadap vault &
              wiki, lalu meng-attest sebelum entri terbit. Data sensitif butuh
              persetujuanmu di Approval Inbox.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input
                value={d.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="What should Swarm remember?"
                className={inputCls}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={d.type}
                  onChange={(e) => set("type", e.target.value as MemType)}
                  className={inputCls}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={d.status}
                  onChange={(e) => set("status", e.target.value as MemStatus)}
                  className={inputCls}
                >
                  <option value="active">active</option>
                  <option value="superseded">superseded</option>
                  <option value="archived">archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Tags</label>
              <input
                value={d.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="comma, separated, tags"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Confidence (optional)</label>
              <input
                value={d.confidence}
                onChange={(e) => set("confidence", e.target.value)}
                placeholder="0–1 (e.g. 0.9)"
                inputMode="decimal"
                className={`${inputCls} num`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Data sensitif</label>
                <select
                  value={d.sensitif}
                  onChange={(e) => set("sensitif", e.target.value)}
                  className={inputCls}
                >
                  <option value="tidak">tidak</option>
                  <option value="ya">ya</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Kelas bukti</label>
                <select
                  value={d.kelas_bukti}
                  onChange={(e) => set("kelas_bukti", e.target.value)}
                  className={inputCls}
                >
                  <option value="primer">primer</option>
                  <option value="sekunder">sekunder</option>
                  <option value="tersier">tersier</option>
                  <option value="sintesis">sintesis</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Sumber (wajib untuk angka/klaim)</label>
              <input
                value={d.sumber}
                onChange={(e) => set("sumber", e.target.value)}
                placeholder="path/URL sumber + halaman di bawah"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Halaman</label>
                <input
                  value={d.halaman}
                  onChange={(e) => set("halaman", e.target.value)}
                  placeholder="mis. 3-4"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Perkara (opsional)</label>
                <input
                  value={d.perkara}
                  onChange={(e) => set("perkara", e.target.value)}
                  placeholder="folder kasus/dosir"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Body · markdown</label>
              <textarea
                value={d.body}
                onChange={(e) => set("body", e.target.value)}
                rows={10}
                placeholder={"# Heading\n- bullet\n- [ ] task\n\nInline `code` supported."}
                className={`${inputCls} resize-y leading-relaxed`}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                onClick={save}
                disabled={busy || !d.title.trim()}
              >
                <Check className="w-3.5 h-3.5" />
                Kirim ke librarian
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ask Librarian panel ───────────────────────────────────
// Label & progres berbasis STATUS NYATA request — monotonik, tidak berputar/maju-mundur.
const ASK_STATUS_LABEL: Record<string, string> = {
  queued: "Menunggu giliran di antrean…",
  awaiting_approval: "Menunggu persetujuan…",
  approved: "Disetujui — librarian mulai bekerja…",
  running: "Librarian sedang menelusuri Information Library…",
  done: "Selesai",
};
const ASK_STATUS_SHORT: Record<string, string> = {
  queued: "antre",
  awaiting_approval: "antre",
  approved: "mulai",
  running: "berjalan",
  done: "selesai",
  failed: "gagal",
  rejected: "ditolak",
  cancelled: "batal",
};
const ASK_STATUS_PROGRESS: Record<string, number> = {
  queued: 15,
  awaiting_approval: 15,
  approved: 35,
  running: 60,
  done: 100,
};
const ASK_TITLE_PREFIX = "Ask Librarian — ";
const ASK_SESSION_KEY = "hq.ask.session.v1";

interface AskHistoryItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

function fmtElapsed(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

// ── Propose Librarian (Usulkan ke librarian) ──────────────
const PROPOSE_SESSION_KEY = "hq.propose.session.v1";
const PROPOSE_TITLE_PREFIX = "Kurasi proposa: ";
const PROPOSE_TYPES = [
  "note", "vendor", "produk", "standar", "proyek", "dosir",
  "catatan", "keputusan", "pelajaran", "fakta", "document", "reference",
];

interface ProposeAttachment {
  name: string;
  kind: "file" | "url";
  value: string; // path relatif shared ws (file) atau URL
  size?: number;
}
interface ProposeResult {
  summary: string;
  verdict: string; // terverifikasi | perlu_revisi | ditolak | menunggu_persetujuan
  vaultPath: string;
  promoted: boolean;
  wikiPath: string;
  custodian: { verdict?: string; catatan_verifikasi?: string };
  revisi: { item: string; perbaikan: string }[];
  sources: { title: string; url: string }[];
}
interface ProposeHistoryItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}
interface ProposePrefill {
  requestId: string; // revisiOf untuk submit revisi
  title: string;
  body: string;
  type: string;
  tags: string;
  sumber: string;
  halaman: string;
  kelas_bukti: string;
  sensitif: string;
  perkara: string;
  attachments: ProposeAttachment[];
  feedback: string;
  revisionNo: number;
}
function emptyProposePrefill(): ProposePrefill {
  return {
    requestId: "",
    title: "",
    body: "",
    type: "note",
    tags: "",
    sumber: "",
    halaman: "",
    kelas_bukti: "sekunder",
    sensitif: "tidak",
    perkara: "",
    attachments: [],
    feedback: "",
    revisionNo: 0,
  };
}
function proposeVerdictTone(v: string): Tone {
  if (v === "terverifikasi") return "up";
  if (v === "perlu_revisi" || v === "menunggu_persetujuan") return "warn";
  if (v === "ditolak") return "down";
  return "neutral";
}

function AskPanel({
  open,
  q,
  setQ,
  phase,
  status,
  submittedAt,
  result,
  error,
  rawResult,
  requestId,
  history,
  historyMore,
  onSubmit,
  onReset,
  onSelectHistory,
  onLoadMoreHistory,
}: {
  open: boolean;
  q: string;
  setQ: (v: string) => void;
  phase: "idle" | "loading" | "done" | "error";
  status: string | null;
  submittedAt: number | null;
  result: AskResult | null;
  error: string;
  rawResult: string;
  requestId: string | null;
  history: AskHistoryItem[];
  historyMore: boolean;
  onSubmit: () => void;
  onReset: () => void;
  onSelectHistory: (id: string) => void;
  onLoadMoreHistory: () => void;
}) {
  // Waktu berjalan sejak submit — monotonic (pengganti teks fase yang berputar).
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== "loading") return;
    const tick = () =>
      setElapsed(submittedAt ? Math.floor((Date.now() - submittedAt) / 1000) : 0);
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [phase, submittedAt]);

  const canSubmit = q.trim().length >= 3 && phase !== "loading";
  return (
    <Panel className="hq-rise !p-0 overflow-hidden border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]">
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%)",
          borderColor: "var(--line)",
        }}
      >
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 16%, var(--surface-2))", color: "var(--accent)" }}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text)] flex items-center gap-2">
            Ask Librarian
            <span className="hidden sm:inline num text-[10.5px] px-2 py-0.5 rounded-full border" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, var(--line))", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
              data dari Information Library
            </span>
          </div>
          <p className="text-[12px] text-[var(--text-3)] mt-0.5">
            Tanyakan informasi — librarian mencari di wiki, analisa vault & dokumen, lalu menjawab dalam tabel data.
          </p>
        </div>
        {phase === "done" && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RefreshCw className="w-3.5 h-3.5" /> Tanya lagi
          </Button>
        )}
      </div>

      <div className="px-5 py-4">
        {/* Input */}
        {phase !== "loading" && (
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
                placeholder='Contoh: "Berapa margin desain link fiber yang dipakai di proyek?"'
                className="w-full bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] pl-10 pr-3.5 py-2.5 rounded-[10px] border border-[var(--line)] focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] outline-none transition-colors"
              />
            </div>
            <Button variant="primary" onClick={onSubmit} disabled={!canSubmit}>
              <Send className="w-3.5 h-3.5" /> Tanya
            </Button>
          </div>
        )}

        {/* Loading — status NYATA + progres monotonik (tidak berputar/maju-mundur) */}
        {phase === "loading" && (
          <div className="flex items-start gap-3.5 py-2">
            <div className="relative mt-0.5 shrink-0">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                <span className="text-[13.5px] font-medium text-[var(--text)]">
                  {ASK_STATUS_LABEL[status ?? "queued"] ?? "Librarian sedang menelusuri Information Library…"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${ASK_STATUS_PROGRESS[status ?? "queued"] ?? 15}%`,
                      background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, transparent), var(--accent))",
                    }}
                  />
                </div>
                <span className="num text-[11px] text-[var(--text-3)] shrink-0 tabular-nums">
                  {fmtElapsed(elapsed)}
                </span>
              </div>
              <p className="num text-[11px] text-[var(--text-3)] mt-1.5">
                request {requestId ? `#${requestId.slice(-6)}` : "…"} · librarian berjalan di latar
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--down)" }}>
            <X className="w-4 h-4 shrink-0" />
            <span>{error || "Gagal menjawab — coba lagi."}</span>
            <Button variant="ghost" size="sm" onClick={onReset}>
              Coba lagi
            </Button>
          </div>
        )}

        {/* Fallback: hasil mentah bila JSON tidak terbaca sebagai tabel */}
        {phase === "error" && rawResult && (
          <details className="mt-3 rounded-[10px] border border-[var(--line)] overflow-hidden">
            <summary className="cursor-pointer px-3.5 py-2 text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors">
              Lihat hasil mentah dari librarian ({rawResult.length} karakter)
            </summary>
            <pre className="px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-2)] bg-[var(--surface-1)] whitespace-pre-wrap break-words max-h-64 overflow-auto">
              {rawResult.slice(0, 4000)}
              {rawResult.length > 4000 ? "\n… (terpotong untuk tampilan)" : ""}
            </pre>
          </details>
        )}

        {/* Result — jawaban + tabel dinamis + sumber */}
        {phase === "done" && result && (
          <div className="mt-1 space-y-4">
            {result.answer && (
              <div className="text-[13.5px] leading-relaxed text-[var(--text-2)]">{result.answer}</div>
            )}

            {result.tables.length > 0 ? (
              <div className="space-y-3">
                {result.tables.map((t, ti) => (
                  <div key={ti} className="rounded-[12px] border border-[var(--line)] overflow-hidden">
                    <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--line)] bg-[var(--surface-1)]">
                      <Table2 className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                      <span className="text-[12.5px] font-semibold text-[var(--text)]">{t.title}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--line)]">
                            {(t.columns || []).map((c, ci) => (
                              <th
                                key={ci}
                                className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)] whitespace-nowrap"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(t.rows || []).map((r, ri) => (
                            <tr key={ri} className={ri % 2 ? "bg-[var(--surface-1)]" : ""}>
                              {(t.columns || []).map((_, ci) => (
                                <td key={ci} className="px-3.5 py-2 text-[13px] text-[var(--text-2)] border-t border-[var(--line)]/60 align-top">
                                  {r[ci] != null ? String(r[ci]) : ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12.5px] text-[var(--text-3)]">Tidak ada tabel — informasi berupa teks di atas.</div>
            )}

            {result.sources.length > 0 && (
              <div>
                <div className="eyebrow !mb-1.5">sumber</div>
                <div className="space-y-1">
                  {result.sources.map((s, si) => (
                    <a
                      key={si}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 rounded-[8px] px-2.5 py-1.5 hover:bg-[var(--surface-2)] transition-colors group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mt-[3px] shrink-0" style={{ color: "var(--text-3)" }} />
                      <span className="text-[12.5px] text-[var(--text-2)] group-hover:text-[var(--text)] leading-snug">
                        {s.title || s.url}
                        <span className="num text-[11px] text-[var(--text-3)] ml-2">
                          rank {s.rank ?? "?"}
                          {s.relevance ? ` · ${s.relevance}` : ""}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Riwayat request — 3 terakhir + lihat lebih lama */}
        {(history.length > 0 || historyMore) && (
          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <div className="eyebrow !mb-2">riwayat request</div>
            <div className="space-y-0.5">
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onSelectHistory(h.id)}
                  className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 hover:bg-[var(--surface-2)] transition-colors text-left group"
                >
                  <History className="w-3.5 h-3.5 shrink-0 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] text-[var(--text)] truncate">
                      {(h.title || "").replace(ASK_TITLE_PREFIX, "") || h.title}
                    </span>
                    <span className="block num text-[10.5px] text-[var(--text-3)] mt-0.5">
                      {ASK_STATUS_SHORT[h.status] ?? h.status} · {timeAgo(h.createdAt || null)}
                    </span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--text-3)] group-hover:text-[var(--text)] transition-colors" />
                </button>
              ))}
            </div>
            {historyMore && (
              <button
                type="button"
                onClick={onLoadMoreHistory}
                className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Lihat riwayat lebih lama
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// ── Propose Librarian panel ───────────────────────────────
function ProposePanel({
  open,
  prefill,
  phase,
  status,
  submittedAt,
  result,
  error,
  rawResult,
  requestId,
  history,
  historyMore,
  onSubmit,
  onReset,
  onSelectHistory,
  onLoadMoreHistory,
  onRevise,
}: {
  open: boolean;
  prefill: ProposePrefill | null;
  phase: "idle" | "loading" | "done" | "error";
  status: string | null;
  submittedAt: number | null;
  result: ProposeResult | null;
  error: string;
  rawResult: string;
  requestId: string | null;
  history: ProposeHistoryItem[];
  historyMore: boolean;
  onSubmit: (payload: {
    title: string;
    body: string;
    type: string;
    tags: string[];
    sensitif: string;
    perkara: string;
    sumber: string;
    halaman: string;
    kelas_bukti: string;
    attachments: ProposeAttachment[];
    revisiOf?: string;
    revisiNote?: string;
    feedback?: string;
  }) => void;
  onReset: () => void;
  onSelectHistory: (id: string) => void;
  onLoadMoreHistory: () => void;
  onRevise: (result: ProposeResult, requestId: string) => void;
}) {
  const [title, setTitle] = useState(prefill?.title || "");
  const [type, setType] = useState(prefill?.type || "note");
  const [body, setBody] = useState(prefill?.body || "");
  const [tags, setTags] = useState(prefill?.tags || "");
  const [sumber, setSumber] = useState(prefill?.sumber || "");
  const [halaman, setHalaman] = useState(prefill?.halaman || "");
  const [kelasBukti, setKelasBukti] = useState(prefill?.kelas_bukti || "sekunder");
  const [sensitif, setSensitif] = useState(prefill?.sensitif || "tidak");
  const [perkara, setPerkara] = useState(prefill?.perkara || "");
  const [attachments, setAttachments] = useState<ProposeAttachment[]>(prefill?.attachments || []);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const tokenRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tok-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    if (phase !== "loading") return;
    const tick = () =>
      setElapsed(submittedAt ? Math.floor((Date.now() - submittedAt) / 1000) : 0);
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [phase, submittedAt]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const uploadFile = async (f: File) => {
    setUploading(true);
    setUploadErr("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("token", tokenRef.current);
      const r = await fetch("/api/information-library/propose/upload", {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "upload gagal");
      setAttachments((prev) => [
        ...prev,
        { name: d.name || f.name, kind: "file", value: d.path, size: d.size },
      ]);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "upload gagal");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    setAttachments((prev) => [...prev, { name: u.length > 60 ? u.slice(0, 57) + "…" : u, kind: "url", value: u }]);
    setUrlInput("");
  };

  const removeAtt = (i: number) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    title.trim().length >= 3 && phase !== "loading" && !uploading;
  const isRev = (prefill?.revisionNo || 0) > 0;

  const submit = () => {
    onSubmit({
      title: title.trim(),
      body: body.trim(),
      type,
      tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      sensitif,
      perkara: perkara.trim(),
      sumber: sumber.trim(),
      halaman: halaman.trim(),
      kelas_bukti: kelasBukti,
      attachments,
      ...(isRev && prefill
        ? { revisiOf: prefill.requestId, revisiNote: "Revisi dikirim dari HQ", feedback: prefill.feedback }
        : {}),
    });
  };

  const inputCls =
    "w-full bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] px-3.5 py-2.5 rounded-[10px] border border-[var(--line)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors";
  const labelCls = "block eyebrow !mb-1.5";
  const verdictTone = result ? proposeVerdictTone(result.verdict) : "neutral";

  return (
    <Panel className="hq-rise !p-0 overflow-hidden border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]">
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%)",
          borderColor: "var(--line)",
        }}
      >
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 16%, var(--surface-2))", color: "var(--accent)" }}>
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text)] flex items-center gap-2">
            Usulkan ke librarian
            <span className="hidden sm:inline num text-[10.5px] px-2 py-0.5 rounded-full border" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, var(--line))", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
              kurasi → custodian → promote
            </span>
          </div>
          <p className="text-[12px] text-[var(--text-3)] mt-0.5">
            Usulkan knowledge dengan lampiran file/URL — librarian menilai, dedup & meninjau, custodian memverifikasi, lalu promote ke wiki.
          </p>
        </div>
        {(phase === "done" || phase === "error") && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RefreshCw className="w-3.5 h-3.5" /> Usulan baru
          </Button>
        )}
      </div>

      <div className="px-5 py-4">
        {/* Banner revisi */}
        {isRev && prefill && (
          <div className="mb-4 rounded-[10px] border px-3.5 py-3 text-[12.5px]" style={{ borderColor: "color-mix(in srgb, var(--warn) 40%, var(--line))", background: "color-mix(in srgb, var(--warn) 8%, transparent)", color: "var(--text-2)" }}>
            <div className="font-semibold text-[var(--text)] mb-1">Revisi #{prefill.revisionNo} — perbaiki sesuai feedback custodian:</div>
            <div className="whitespace-pre-wrap">{prefill.feedback || "(tanpa feedback)"}</div>
          </div>
        )}

        {/* Form */}
        {phase !== "loading" && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Judul proposa</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Contoh: "Profil vendor Recorded Future — lisensi & skor kredibilitas"'
                className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Tipe</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                  {PROPOSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Kelas bukti</label>
                <select value={kelasBukti} onChange={(e) => setKelasBukti(e.target.value)} className={inputCls}>
                  {["primer", "sekunder", "tersier", "sintesis"].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Sensitif?</label>
                <select value={sensitif} onChange={(e) => setSensitif(e.target.value)} className={inputCls}>
                  <option value="tidak">tidak</option>
                  <option value="ya">ya (butuh persetujuan)</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Isi / klaim knowledge</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5}
                placeholder="Tulis isi knowledge: fakta, angka (sertakan sumber & halaman), analisa…"
                className={`${inputCls} resize-y`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Sumber</label>
                <input value={sumber} onChange={(e) => setSumber(e.target.value)} placeholder="docs/… atau URL" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Halaman</label>
                <input value={halaman} onChange={(e) => setHalaman(e.target.value)} placeholder="mis. 12" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Perkara (bila dosir)</label>
                <input value={perkara} onChange={(e) => setPerkara(e.target.value)} placeholder="opsional" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags (koma)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vendor, siem, keamanan" className={inputCls} />
            </div>

            {/* Attachments */}
            <div>
              <label className={labelCls}>Lampiran — file atau URL</label>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                <Button variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5" /> {uploading ? "Mengunggah…" : "Upload file"}
                </Button>
                <div className="flex-1 min-w-[220px] flex items-center gap-2">
                  <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUrl()}
                    placeholder="https://… atau path file di shared workspace" className={inputCls} />
                  <Button variant="secondary" size="sm" onClick={addUrl}>
                    <Link2 className="w-3.5 h-3.5" /> Tambah
                  </Button>
                </div>
              </div>
              {uploadErr && <p className="text-[12px] mt-1.5" style={{ color: "var(--down)" }}>{uploadErr}</p>}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-1)] px-2.5 py-1.5">
                      {a.kind === "file"
                        ? <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                        : <Link2 className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />}
                      <span className="flex-1 min-w-0 text-[12.5px] text-[var(--text-2)] truncate">{a.name}</span>
                      {a.size != null && <span className="num text-[10.5px] text-[var(--text-3)] shrink-0">{(a.size / 1024).toFixed(0)} KB</span>}
                      <button type="button" onClick={() => removeAtt(i)} className="shrink-0 text-[var(--text-3)] hover:text-[var(--down)] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Button variant="primary" onClick={submit} disabled={!canSubmit}>
                <Send className="w-3.5 h-3.5" /> {isRev ? `Kirim revisi #${prefill.revisionNo}` : "Usulkan"}
              </Button>
              <span className="num text-[11px] text-[var(--text-3)]">
                librarian & custodian memproses di latar
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {phase === "loading" && (
          <div className="flex items-start gap-3.5 py-2">
            <div className="relative mt-0.5 shrink-0">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                <span className="text-[13.5px] font-medium text-[var(--text)]">
                  {ASK_STATUS_LABEL[status ?? "queued"] ?? "Librarian sedang menilai proposa…"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${ASK_STATUS_PROGRESS[status ?? "queued"] ?? 15}%`,
                      background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, transparent), var(--accent))",
                    }}
                  />
                </div>
                <span className="num text-[11px] text-[var(--text-3)] shrink-0 tabular-nums">{fmtElapsed(elapsed)}</span>
              </div>
              <p className="num text-[11px] text-[var(--text-3)] mt-1.5">
                request {requestId ? `#${requestId.slice(-6)}` : "…"} · kurasi → verifikasi custodian → promote
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--down)" }}>
            <X className="w-4 h-4 shrink-0" />
            <span>{error || "Gagal mengirim — coba lagi."}</span>
            <Button variant="ghost" size="sm" onClick={onReset}>Coba lagi</Button>
          </div>
        )}

        {/* Fallback raw */}
        {phase === "error" && rawResult && (
          <details className="mt-3 rounded-[10px] border border-[var(--line)] overflow-hidden">
            <summary className="cursor-pointer px-3.5 py-2 text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors">
              Lihat hasil mentah dari librarian ({rawResult.length} karakter)
            </summary>
            <pre className="px-3.5 py-3 text-[11.5px] leading-relaxed text-[var(--text-2)] bg-[var(--surface-1)] whitespace-pre-wrap break-words max-h-64 overflow-auto">
              {rawResult.slice(0, 4000)}
              {rawResult.length > 4000 ? "\n… (terpotong untuk tampilan)" : ""}
            </pre>
          </details>
        )}

        {/* Result — workflow librarian + custodian */}
        {phase === "done" && result && (
          <div className="mt-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={verdictTone}>
                {result.verdict === "terverifikasi" ? "✓ Terverifikasi" : result.verdict || "diproses"}
              </Pill>
              {result.promoted && <Pill tone="up">✓ Terpromosi ke wiki</Pill>}
              {result.custodian?.verdict && (
                <Pill tone={proposeVerdictTone(result.custodian.verdict)}>
                  Custodian: {result.custodian.verdict}
                </Pill>
              )}
            </div>

            {result.summary && (
              <div className="text-[13.5px] leading-relaxed text-[var(--text-2)]">{result.summary}</div>
            )}

            {result.vaultPath && (
              <a href={`/api/information-library/file?root=vault&path=${encodeURIComponent(result.vaultPath)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-[12.5px] rounded-[8px] px-2.5 py-2 hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: "var(--accent)" }}>
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="truncate">{result.vaultPath}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
            {result.wikiPath && (
              <div className="text-[12.5px] text-[var(--text-3)] num">wiki: {result.wikiPath}</div>
            )}

            {result.custodian?.catatan_verifikasi && (
              <div className="rounded-[10px] border border-[var(--line)] overflow-hidden">
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--line)] bg-[var(--surface-1)]">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  <span className="text-[12.5px] font-semibold text-[var(--text)]">Catatan verifikasi custodian</span>
                </div>
                <div className="px-3.5 py-3 text-[13px] leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">
                  {result.custodian.catatan_verifikasi}
                </div>
              </div>
            )}

            {result.revisi.length > 0 && (
              <div className="rounded-[10px] border border-[var(--line)] overflow-hidden">
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--line)] bg-[var(--surface-1)]">
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: "var(--warn)" }} />
                  <span className="text-[12.5px] font-semibold text-[var(--text)]">Perlu revisi ({result.revisi.length})</span>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  {result.revisi.map((r, ri) => (
                    <div key={ri} className="px-3.5 py-2.5 text-[12.5px]">
                      <div className="font-medium text-[var(--text)]">{r.item}</div>
                      <div className="text-[var(--text-3)] mt-0.5">{r.perbaikan}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.verdict === "perlu_revisi" && (
              <Button variant="secondary" size="sm" onClick={() => onRevise(result, requestId || "")}>
                <RefreshCw className="w-3.5 h-3.5" /> Revisi & kirim ulang
              </Button>
            )}

            {result.sources.length > 0 && (
              <div>
                <div className="eyebrow !mb-1.5">sumber</div>
                <div className="space-y-1">
                  {result.sources.map((s, si) => (
                    <a key={si} href={s.url} target="_blank" rel="noreferrer"
                      className="flex items-start gap-2 rounded-[8px] px-2.5 py-1.5 hover:bg-[var(--surface-2)] transition-colors group">
                      <ExternalLink className="w-3.5 h-3.5 mt-[3px] shrink-0" style={{ color: "var(--text-3)" }} />
                      <span className="text-[12.5px] text-[var(--text-2)] group-hover:text-[var(--text)] leading-snug">
                        {s.title || s.url}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Riwayat proposa */}
        {(history.length > 0 || historyMore) && (
          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <div className="eyebrow !mb-2">riwayat usulan</div>
            <div className="space-y-0.5">
              {history.map((h) => (
                <button key={h.id} type="button" onClick={() => onSelectHistory(h.id)}
                  className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 hover:bg-[var(--surface-2)] transition-colors text-left group">
                  <History className="w-3.5 h-3.5 shrink-0 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] text-[var(--text)] truncate">
                      {(h.title || "").replace(PROPOSE_TITLE_PREFIX, "") || h.title}
                    </span>
                    <span className="block num text-[10.5px] text-[var(--text-3)] mt-0.5">
                      {ASK_STATUS_SHORT[h.status] ?? h.status} · {timeAgo(h.createdAt || null)}
                    </span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--text-3)] group-hover:text-[var(--text)] transition-colors" />
                </button>
              ))}
            </div>
            {historyMore && (
              <button type="button" onClick={onLoadMoreHistory}
                className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity">
                Lihat riwayat lebih lama
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function InformationLibraryPage() {
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusAll, setStatusAll] = useState(false);
  const [vaultStatus, setVaultStatus] = useState<string>("all");
  const [scope, setScope] = useState<Scope>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [domainCounts, setDomainCounts] = useState<Record<string, number>>({});
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editor, setEditor] = useState<{ draft: Draft; isNew: boolean } | null>(
    null
  );

  // ── Ask Librarian state ──
  const [askOpen, setAskOpen] = useState(false);
  const [askQ, setAskQ] = useState("");
  const [askPhase, setAskPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [askResult, setAskResult] = useState<AskResult | null>(null);
  const [askError, setAskError] = useState("");
  const [askRawResult, setAskRawResult] = useState("");
  const [askRequestId, setAskRequestId] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState<string | null>(null);
  const [askSubmittedAt, setAskSubmittedAt] = useState<number | null>(null);
  const [askHistory, setAskHistory] = useState<AskHistoryItem[]>([]);
  const [askHistoryMore, setAskHistoryMore] = useState(false);
  const [askHistoryTake, setAskHistoryTake] = useState(3);

  // ── Ask Librarian: sesi (persist lintas refresh) & riwayat ──
  const saveAskSession = useCallback(
    (s: { requestId: string; question: string; submittedAt: number } | null) => {
      try {
        if (s) localStorage.setItem(ASK_SESSION_KEY, JSON.stringify(s));
        else localStorage.removeItem(ASK_SESSION_KEY);
      } catch {
        /* storage tidak tersedia — abaikan */
      }
    },
    []
  );

  const loadAskHistory = useCallback(async (take: number) => {
    const data = await getJSON<{
      requests?: { id: string; title: string; status: string; createdAt: string }[];
    }>(`/api/brahma/requests?title=${encodeURIComponent("Ask Librarian")}&take=${take}&light=1`);
    const list = (data?.requests ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
    }));
    setAskHistory(list.slice(0, take));
    setAskHistoryMore(list.length >= take);
  }, []);

  const loadMoreAskHistory = useCallback(() => {
    const next = askHistoryTake + 12;
    setAskHistoryTake(next);
    loadAskHistory(next);
  }, [askHistoryTake, loadAskHistory]);

  // Pilih riwayat → render ulang jawaban dari request tsb (atau lanjut polling bila masih jalan)
  const selectAskHistory = useCallback(async (id: string) => {
    setAskRequestId(id);
    setAskResult(null);
    setAskError("");
    setAskRawResult("");
    const data = await getJSON<{
      request?: { status?: string; result?: string | null; title?: string };
    }>(`/api/brahma/requests/${id}`);
    if (!data?.request) {
      setAskError("Request tidak ditemukan — mungkin sudah dihapus.");
      setAskPhase("error");
      return;
    }
    const st = data.request.status;
    setAskStatus(st ?? null);
    const q = (data.request.title || "").replace(ASK_TITLE_PREFIX, "");
    if (q) setAskQ(q);
    if (st === "done") {
      const raw = data.request.result || "";
      const parsed = parseAskResult(raw);
      setAskResult(parsed);
      setAskPhase(parsed ? "done" : "error");
      if (!parsed) {
        setAskRawResult(raw);
        setAskError("Hasil riwayat tidak terbaca sebagai tabel — tampilan mentah di bawah.");
      }
    } else if (st === "failed" || st === "rejected" || st === "cancelled") {
      setAskError(`Request ${st} — tidak ada jawaban untuk riwayat ini.`);
      setAskPhase("error");
    } else {
      setAskPhase("loading"); // polling dilanjutkan otomatis oleh efek utama
    }
  }, []);

  const submitAsk = useCallback(async () => {
    const question = askQ.trim();
    if (question.length < 3) return;
    setAskPhase("loading");
    setAskResult(null);
    setAskError("");
    setAskRawResult("");
    setAskStatus(null);
    try {
      const r = await fetch("/api/information-library/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "gagal dispatch");
      const id = data.request?.id || null;
      setAskRequestId(id);
      setAskStatus("queued");
      const now = Date.now();
      setAskSubmittedAt(now);
      if (id) saveAskSession({ requestId: id, question, submittedAt: now });
      loadAskHistory(3);
    } catch (e) {
      setAskError(e instanceof Error ? e.message : "gagal dispatch");
      setAskPhase("error");
    }
  }, [askQ, loadAskHistory, saveAskSession]);

  // Poll status request saat loading — status nyata menggerakkan label & progres
  useEffect(() => {
    if (askPhase !== "loading" || !askRequestId) return;
    let cancelled = false;
    const iv = setInterval(async () => {
      const data = await getJSON<{ request?: { status?: string; result?: string | null } }>(
        `/api/brahma/requests/${askRequestId}`
      );
      if (cancelled) return;
      if (!data?.request) return;
      const st = data.request.status;
      setAskStatus(st ?? null);
      if (st === "done") {
        clearInterval(iv);
        const raw = data.request.result || "";
        const parsed = parseAskResult(raw);
        setAskResult(parsed);
        setAskPhase(parsed ? "done" : "error");
        if (!parsed) {
          setAskRawResult(raw);
          setAskError("Librarian selesai tapi hasil tidak terbaca sebagai tabel — tampilan mentah di bawah.");
        }
        loadAskHistory(3);
      } else if (st === "failed" || st === "rejected" || st === "cancelled") {
        clearInterval(iv);
        setAskError(`Request ${st} — coba lagi atau periksa antrean.`);
        setAskPhase("error");
        loadAskHistory(3);
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [askPhase, askRequestId, loadAskHistory]);

  // Pulihkan sesi Ask setelah refresh (progres tidak hilang)
  useEffect(() => {
    let s: { requestId: string; question: string; submittedAt: number } | null = null;
    try {
      const raw = localStorage.getItem(ASK_SESSION_KEY);
      if (raw) s = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (s?.requestId) {
      setAskQ(s.question || "");
      setAskOpen(true);
      setAskSubmittedAt(s.submittedAt ?? null);
      setAskRequestId(s.requestId);
      getJSON<{ request?: { status?: string; result?: string | null } }>(
        `/api/brahma/requests/${s.requestId}`
      ).then((data) => {
        const st = data?.request?.status;
        if (!st) {
          setAskError("Request tidak ditemukan — mungkin sudah dihapus.");
          setAskPhase("error");
          saveAskSession(null);
          return;
        }
        setAskStatus(st);
        if (st === "done") {
          const raw = data.request?.result || "";
          const parsed = parseAskResult(raw);
          setAskResult(parsed);
          setAskPhase(parsed ? "done" : "error");
          if (!parsed) {
            setAskRawResult(raw);
            setAskError("Hasil tidak terbaca sebagai tabel — tampilan mentah di bawah.");
          }
        } else if (st === "failed" || st === "rejected" || st === "cancelled") {
          setAskError(`Request ${st} — coba lagi atau periksa antrean.`);
          setAskPhase("error");
        } else {
          setAskPhase("loading"); // lanjut polling via efek utama
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Muat riwayat saat panel dibuka
  useEffect(() => {
    if (askOpen) loadAskHistory(3);
  }, [askOpen, loadAskHistory]);

  const resetAsk = useCallback(() => {
    setAskPhase("idle");
    setAskResult(null);
    setAskError("");
    setAskRawResult("");
    setAskRequestId(null);
    setAskStatus(null);
    setAskSubmittedAt(null);
    saveAskSession(null);
  }, [saveAskSession]);

  // ── Propose Librarian state ──
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposePhase, setProposePhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [proposeResult, setProposeResult] = useState<ProposeResult | null>(null);
  const [proposeError, setProposeError] = useState("");
  const [proposeRaw, setProposeRaw] = useState("");
  const [proposeRequestId, setProposeRequestId] = useState<string | null>(null);
  const [proposeStatus, setProposeStatus] = useState<string | null>(null);
  const [proposeSubmittedAt, setProposeSubmittedAt] = useState<number | null>(null);
  const [proposeHistory, setProposeHistory] = useState<ProposeHistoryItem[]>([]);
  const [proposeHistoryMore, setProposeHistoryMore] = useState(false);
  const [proposeHistoryTake, setProposeHistoryTake] = useState(3);
  const [proposePrefill, setProposePrefill] = useState<ProposePrefill | null>(null);
  const [proposeCurTitle, setProposeCurTitle] = useState("");
  const proposeLastPayload = useRef<{
    title: string; body: string; type: string; tags: string[];
    sumber: string; halaman: string; kelas_bukti: string; sensitif: string; perkara: string;
    attachments: ProposeAttachment[];
  } | null>(null);

  const saveProposeSession = useCallback(
    (s: { requestId: string; title: string; submittedAt: number } | null) => {
      try {
        if (s) localStorage.setItem(PROPOSE_SESSION_KEY, JSON.stringify(s));
        else localStorage.removeItem(PROPOSE_SESSION_KEY);
      } catch {
        /* storage tidak tersedia — abaikan */
      }
    },
    []
  );

  const loadProposeHistory = useCallback(async (take: number) => {
    const data = await getJSON<{
      requests?: { id: string; title: string; status: string; createdAt: string }[];
    }>(`/api/brahma/requests?title=${encodeURIComponent("Kurasi proposa")}&take=${take}&light=1`);
    const list = (data?.requests ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
    }));
    setProposeHistory(list.slice(0, take));
    setProposeHistoryMore(list.length >= take);
  }, []);

  const loadMoreProposeHistory = useCallback(() => {
    const next = proposeHistoryTake + 12;
    setProposeHistoryTake(next);
    loadProposeHistory(next);
  }, [proposeHistoryTake, loadProposeHistory]);

  // Pilih riwayat → render ulang hasil workflow (atau lanjut polling bila masih jalan)
  const selectProposeHistory = useCallback(async (id: string) => {
    setProposeRequestId(id);
    setProposeResult(null);
    setProposeError("");
    setProposeRaw("");
    const data = await getJSON<{
      request?: { status?: string; result?: string | null; title?: string };
    }>(`/api/brahma/requests/${id}`);
    if (!data?.request) {
      setProposeError("Request tidak ditemukan — mungkin sudah dihapus.");
      setProposePhase("error");
      return;
    }
    const st = data.request.status;
    setProposeStatus(st ?? null);
    const t = (data.request.title || "").replace(PROPOSE_TITLE_PREFIX, "");
    if (t) setProposeCurTitle(t);
    if (st === "done") {
      const raw = data.request.result || "";
      const parsed = parseProposeResult(raw);
      setProposeResult(parsed);
      setProposePhase(parsed ? "done" : "error");
      if (!parsed) {
        setProposeRaw(raw);
        setProposeError("Hasil riwayat tidak terbaca — tampilan mentah di bawah.");
      }
    } else if (st === "failed" || st === "rejected" || st === "cancelled") {
      setProposeError(`Request ${st} — tidak ada hasil untuk riwayat ini.`);
      setProposePhase("error");
    } else {
      setProposePhase("loading"); // polling dilanjutkan otomatis
    }
  }, []);

  // Revisi: isi ulang form dari payload terakhir (persist di localStorage) + feedback custodian
  const revisePropose = useCallback(
    (result: ProposeResult, requestId: string) => {
      const p = proposeLastPayload.current;
      const title = proposeCurTitle || p?.title || "";
      const feedback =
        result.custodian?.catatan_verifikasi || result.summary || "Revisi diminta";
      setProposePrefill({
        requestId: requestId || "",
        title,
        body: p?.body || "",
        type: p?.type || "note",
        tags: p?.tags?.join(", ") || "",
        sumber: p?.sumber || "",
        halaman: p?.halaman || "",
        kelas_bukti: p?.kelas_bukti || "sekunder",
        sensitif: p?.sensitif || "tidak",
        perkara: p?.perkara || "",
        attachments: p?.attachments || [],
        feedback,
        revisionNo: (proposePrefill?.revisionNo || 0) + 1,
      });
      setProposePhase("idle");
      setProposeResult(null);
      setProposeError("");
      setProposeRaw("");
      setProposeRequestId(null);
      setProposeStatus(null);
      setProposeSubmittedAt(null);
    },
    [proposeCurTitle, proposePrefill?.revisionNo]
  );

  const submitPropose = useCallback(
    async (payload: {
      title: string; body: string; type: string; tags: string[]; sensitif: string;
      perkara: string; sumber: string; halaman: string; kelas_bukti: string;
      attachments: ProposeAttachment[]; revisiOf?: string; revisiNote?: string; feedback?: string;
    }) => {
      setProposePhase("loading");
      setProposeResult(null);
      setProposeError("");
      setProposeRaw("");
      setProposeStatus(null);
      proposeLastPayload.current = {
        title: payload.title, body: payload.body, type: payload.type, tags: payload.tags,
        sumber: payload.sumber, halaman: payload.halaman, kelas_bukti: payload.kelas_bukti,
        sensitif: payload.sensitif, perkara: payload.perkara, attachments: payload.attachments,
      };
      try {
        localStorage.setItem("hq.propose.last.v1", JSON.stringify(proposeLastPayload.current));
      } catch {
        /* ignore */
      }
      setProposeCurTitle(payload.title);
      try {
        const r = await fetch("/api/information-library/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "gagal dispatch");
        const id = data.request?.id || null;
        setProposeRequestId(id);
        setProposeStatus("queued");
        const now = Date.now();
        setProposeSubmittedAt(now);
        if (id) saveProposeSession({ requestId: id, title: payload.title, submittedAt: now });
        loadProposeHistory(3);
      } catch (e) {
        setProposeError(e instanceof Error ? e.message : "gagal dispatch");
        setProposePhase("error");
      }
    },
    [loadProposeHistory, saveProposeSession]
  );

  // Poll status proposa saat loading
  useEffect(() => {
    if (proposePhase !== "loading" || !proposeRequestId) return;
    let cancelled = false;
    const iv = setInterval(async () => {
      const data = await getJSON<{ request?: { status?: string; result?: string | null } }>(
        `/api/brahma/requests/${proposeRequestId}`
      );
      if (cancelled) return;
      if (!data?.request) return;
      const st = data.request.status;
      setProposeStatus(st ?? null);
      if (st === "done") {
        clearInterval(iv);
        const raw = data.request.result || "";
        const parsed = parseProposeResult(raw);
        setProposeResult(parsed);
        setProposePhase(parsed ? "done" : "error");
        if (!parsed) {
          setProposeRaw(raw);
          setProposeError("Librarian selesai tapi hasil tidak terbaca — tampilan mentah di bawah.");
        }
        loadProposeHistory(3);
      } else if (st === "failed" || st === "rejected" || st === "cancelled") {
        clearInterval(iv);
        setProposeError(`Request ${st} — coba lagi atau periksa antrean.`);
        setProposePhase("error");
        loadProposeHistory(3);
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [proposePhase, proposeRequestId, loadProposeHistory]);

  // Pulihkan sesi proposa setelah refresh
  useEffect(() => {
    let s: { requestId: string; title: string; submittedAt: number } | null = null;
    try {
      const raw = localStorage.getItem(PROPOSE_SESSION_KEY);
      if (raw) s = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (s?.requestId) {
      setProposeCurTitle(s.title || "");
      setProposeOpen(true);
      setProposeSubmittedAt(s.submittedAt ?? null);
      setProposeRequestId(s.requestId);
      getJSON<{ request?: { status?: string; result?: string | null } }>(
        `/api/brahma/requests/${s.requestId}`
      ).then((data) => {
        const st = data?.request?.status;
        if (!st) {
          setProposeError("Request tidak ditemukan — mungkin sudah dihapus.");
          setProposePhase("error");
          saveProposeSession(null);
          return;
        }
        setProposeStatus(st);
        if (st === "done") {
          const raw = data.request?.result || "";
          const parsed = parseProposeResult(raw);
          setProposeResult(parsed);
          setProposePhase(parsed ? "done" : "error");
          if (!parsed) {
            setProposeRaw(raw);
            setProposeError("Hasil tidak terbaca — tampilan mentah di bawah.");
          }
        } else if (st === "failed" || st === "rejected" || st === "cancelled") {
          setProposeError(`Request ${st} — coba lagi atau periksa antrean.`);
          setProposePhase("error");
        } else {
          setProposePhase("loading"); // lanjut polling via efek utama
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Muat riwayat proposa saat panel dibuka
  useEffect(() => {
    if (proposeOpen) loadProposeHistory(3);
  }, [proposeOpen, loadProposeHistory]);

  // Hidrasi payload proposa terakhir dari localStorage (agar tombol revisi bisa
  // mengisi ulang form walau dibuka dari riwayat di sesi browser baru)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hq.propose.last.v1");
      if (raw) proposeLastPayload.current = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const resetPropose = useCallback(() => {
    setProposePhase("idle");
    setProposeResult(null);
    setProposeError("");
    setProposeRaw("");
    setProposeRequestId(null);
    setProposeStatus(null);
    setProposeSubmittedAt(null);
    setProposePrefill(null);
    saveProposeSession(null);
  }, [saveProposeSession]);

  // Debounce search input → q
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (typeFilter !== "all") params.set("type", typeFilter);
    params.set("scope", scope);
    if (scope === "vault") {
      // Vault memakai status lifecycle (usulan/ditinjau/terkurasi/…) —
      // chip status vault yang bisa diklik jadi sumber filter status.
      params.set("status", vaultStatus);
    } else {
      params.set("status", statusAll ? "all" : "active");
    }
    if (domainFilter !== "all") params.set("domain", domainFilter);
    if (projectFilter !== "all" && projectFilter !== "__docs__")
      params.set("project", projectFilter);
    const data = await getJSON<MemoryResponse>(
      `/api/information-library?${params.toString()}`
    );
    if (data) {
      setEntries(data.entries ?? []);
      setDomainCounts(data.domainCounts ?? {});
      setProjectCounts(data.projectCounts ?? {});
      setTypeCounts(data.typeCounts ?? {});
      setStatusCounts(data.statusCounts ?? {});
      setTotal(data.total ?? 0);
      setLastSync(data.lastSync ?? null);
    }
    setLoaded(true);
  }, [q, typeFilter, statusAll, scope, vaultStatus, domainFilter, projectFilter]);

  // Reload on filter change + poll every 10s
  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const chips = useMemo(() => {
    return TYPES.filter((t) => (typeCounts[t] ?? 0) > 0).map((t) => ({
      type: t,
      count: typeCounts[t] ?? 0,
    }));
  }, [typeCounts]);

  const domainChips = useMemo(() => {
    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
  }, [domainCounts]);

  const projectChips = useMemo(() => {
    return Object.entries(projectCounts)
      .map(([project, count]) => ({ project, count }))
      .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project));
  }, [projectCounts]);

  // Hierarki domain → project dari kumpulan entri terfilter (untuk tampilan grup)
  const groups = useMemo(() => {
    const dm = new Map<string, { count: number; projects: Map<string, number> }>();
    for (const e of entries) {
      const d = e.domain || "other";
      const rec = dm.get(d) || { count: 0, projects: new Map() };
      rec.count++;
      const p = e.project;
      if (p) rec.projects.set(p, (rec.projects.get(p) || 0) + 1);
      dm.set(d, rec);
    }
    return Array.from(dm.entries())
      .map(([domain, rec]) => ({
        domain,
        count: rec.count,
        projects: Array.from(rec.projects.entries())
          .map(([project, count]) => ({ project, count }))
          .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project)),
      }))
      .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
  }, [entries]);

  // paging 10 baris/halaman (lazy render) — reset ke halaman 1 saat filter berubah
  const paged = usePaged(entries);
  useEffect(() => {
    paged.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, typeFilter, scope, statusAll, vaultStatus, domainFilter, projectFilter]);

  const openNew = () =>
    setEditor({ draft: emptyDraft(), isNew: true });
  const openEdit = (e: Entry) =>
    setEditor({ draft: draftFrom(e), isNew: false });

  const inProjectView = projectFilter !== "all";
  const hasFilters =
    q.trim() !== "" ||
    typeFilter !== "all" ||
    scope !== "all" ||
    statusAll ||
    vaultStatus !== "all" ||
    domainFilter !== "all" ||
    projectFilter !== "all";

  const resetFilters = () => {
    setQInput("");
    setQ("");
    setTypeFilter("all");
    setStatusAll(false);
    setVaultStatus("all");
    setScope("all");
    setDomainFilter("all");
    setProjectFilter("all");
  };

  return (
    <>
      <div className="relative z-10 w-full mx-auto pb-16">
        {/* Header */}
        <div className="hq-rise pt-4 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <Eyebrow>Information library</Eyebrow>
            <h1 className="mt-2.5 text-[40px] font-semibold tracking-[-0.025em] leading-none text-[var(--text)]">
              Information Library
            </h1>
            <p className="mt-3.5 text-[14px] text-[var(--text-2)] leading-relaxed max-w-lg">
              Long-term knowledge — Swarm&apos;s memory wiki plus the shared GSP
              workspace (AGENTS.md, MEMORY.md, memory/, docs/). Browse, search,
              and correct.
            </p>
            <p className="num text-[11.5px] text-[var(--text-3)] mt-3">
              synced {timeAgo(lastSync)}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2.5">
            <Button variant="secondary" onClick={() => { setAskOpen((v) => !v); }}>
              <Sparkles className="w-3.5 h-3.5" style={askOpen ? { color: "var(--accent)" } : undefined} />
              Ask Librarian
            </Button>
            <Button variant="primary" onClick={() => { setProposeOpen((v) => !v); }}>
              <Plus className="w-3.5 h-3.5" />
              Usulkan ke librarian
            </Button>
          </div>
        </div>

        {/* Ask Librarian panel */}
        {askOpen && (
          <div className="mb-6">
            <AskPanel
              open={askOpen}
              q={askQ}
              setQ={setAskQ}
              phase={askPhase}
              status={askStatus}
              submittedAt={askSubmittedAt}
              result={askResult}
              error={askError}
              rawResult={askRawResult}
              requestId={askRequestId}
              history={askHistory}
              historyMore={askHistoryMore}
              onSubmit={submitAsk}
              onReset={resetAsk}
              onSelectHistory={selectAskHistory}
              onLoadMoreHistory={loadMoreAskHistory}
            />
          </div>
        )}

        {/* Propose Librarian panel */}
        {proposeOpen && (
          <div className="mb-6">
            <ProposePanel
              key={proposePrefill?.requestId || "new"}
              open={proposeOpen}
              prefill={proposePrefill}
              phase={proposePhase}
              status={proposeStatus}
              submittedAt={proposeSubmittedAt}
              result={proposeResult}
              error={proposeError}
              rawResult={proposeRaw}
              requestId={proposeRequestId}
              history={proposeHistory}
              historyMore={proposeHistoryMore}
              onSubmit={submitPropose}
              onReset={resetPropose}
              onSelectHistory={selectProposeHistory}
              onLoadMoreHistory={loadMoreProposeHistory}
              onRevise={revisePropose}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="hq-rise flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search library — wiki, workspace & vault…"
                className="w-full bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-3)] pl-10 pr-3.5 py-2.5 rounded-[10px] border border-[var(--line)] focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] outline-none transition-colors"
              />
            </div>
            {/* Scope toggle */}
            <div className="flex items-center rounded-full border border-[var(--line)] p-0.5 shrink-0">
              {(["all", "wiki", "workspace", "vault", "archive"] as Scope[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors capitalize ${
                    scope === s
                      ? "bg-[var(--surface-2)] text-[var(--text)]"
                      : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  {s === "all"
                    ? "All"
                    : s === "archive"
                    ? "Arsip"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {/* Status toggle — non-vault scopes (vault pakai chip status di bawah) */}
            {scope !== "vault" && (
              <div className="flex items-center rounded-full border border-[var(--line)] p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusAll(false)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    !statusAll
                      ? "bg-[var(--surface-2)] text-[var(--text)]"
                      : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  Active
                  {statusCounts.active != null && (
                    <span className="num text-[11px] opacity-70 ml-1">
                      {statusCounts.active}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusAll(true)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    statusAll
                      ? "bg-[var(--surface-2)] text-[var(--text)]"
                      : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  All
                  <span className="num text-[11px] opacity-70 ml-1">{total}</span>
                </button>
              </div>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-3.5 h-3.5" />
                Clear filters
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className={showFilters ? "!text-[var(--accent)]" : ""}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
              Filter{chips.length ? ` (${chips.length})` : ""}
            </Button>
          </div>

          {/* Domain filter chips — level 1 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="eyebrow !mb-0 !mr-1">domain</span>
            <FilterChip
              label="All"
              count={total}
              active={domainFilter === "all"}
              onClick={() => {
                setDomainFilter("all");
                setProjectFilter("all");
              }}
            />
            {domainChips.map((d) => (
              <FilterChip
                key={d.domain}
                label={cleanLabel(d.domain)}
                count={d.count}
                tone="accent"
                active={domainFilter === d.domain}
                onClick={() => {
                  setDomainFilter(d.domain);
                  setProjectFilter("all");
                }}
              />
            ))}
          </div>

          {/* Project filter chips — level 2 (hanya saat domain dipilih) */}
          {domainFilter !== "all" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="eyebrow !mb-0 !mr-1">project</span>
              <FilterChip
                label="All projects"
                count={total}
                active={projectFilter === "all"}
                onClick={() => setProjectFilter("all")}
              />
              {projectChips.map((p) => (
                <FilterChip
                  key={p.project}
                  label={cleanLabel(p.project)}
                  count={p.count}
                  tone="up"
                  active={projectFilter === p.project}
                  onClick={() =>
                    setProjectFilter(projectFilter === p.project ? "all" : p.project)
                  }
                />
              ))}
            </div>
          )}

          {/* Type filter chips — tersembunyi di balik tombol Filter (declutter) */}
          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <FilterChip
                label="All"
                count={total}
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
              />
              {chips.map((c) => (
                <FilterChip
                  key={c.type}
                  label={c.type}
                  count={c.count}
                  tone={typeTone(c.type)}
                  active={typeFilter === c.type}
                  onClick={() =>
                    setTypeFilter(typeFilter === c.type ? "all" : c.type)
                  }
                />
              ))}
            </div>
          )}

          {/* Vault status chips — staging lifecycle (bisa diklik = filter) */}
          {scope === "vault" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="eyebrow !mb-0 !mr-1">status</span>
              <FilterChip
                label="All"
                count={total}
                active={vaultStatus === "all"}
                onClick={() => setVaultStatus("all")}
              />
              {Object.entries(statusCounts).map(([s, c]) => (
                <FilterChip
                  key={s}
                  label={s}
                  count={c}
                  tone={vaultStatusTone(s)}
                  active={vaultStatus === s}
                  onClick={() => setVaultStatus((cur) => (cur === s ? "all" : s))}
                />
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="mt-8 space-y-3">
          {!loaded ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : entries.length === 0 ? (
            <Panel className="p-2">
              <EmptyState
                icon={<BookOpen className="w-6 h-6" />}
                title={
                  hasFilters
                    ? "No matching entries"
                    : "No memory synced yet"
                }
                hint={
                  hasFilters
                    ? "Try a different search or clear the filters."
                    : "Once the Swarm bridge is running with a ~/.hermes/wiki, entries appear here."
                }
                action={
                  hasFilters ? (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            </Panel>
          ) : inProjectView ? (
            // Dokumen project terpilih — daftar flat (dipaginasi)
            paged.slice.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                expanded={expandedId === e.id}
                onToggle={() =>
                  setExpandedId((cur) => (cur === e.id ? null : e.id))
                }
                onEdit={() => openEdit(e)}
              />
            ))
          ) : (
            // Tampilan grup: domain → project (drill-down, bukan ribuan baris)
            <div className="space-y-3">
              {/* Breadcrumb navigasi */}
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-3)] flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setDomainFilter("all");
                    setProjectFilter("all");
                  }}
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Domains
                </button>
                {domainFilter !== "all" && (
                  <>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setProjectFilter("all")}
                      className="hover:text-[var(--accent)] transition-colors capitalize"
                    >
                      {cleanLabel(domainFilter)}
                    </button>
                  </>
                )}
              </div>

              {domainFilter === "all" ? (
                groups.map((g) => (
                  <GroupCard
                    key={g.domain}
                    title={cleanLabel(g.domain)}
                    subtitle={`${g.projects.length} project · ${g.count} dokumen`}
                    count={g.count}
                    onClick={() => setDomainFilter(g.domain)}
                  />
                ))
              ) : (
                (() => {
                  const g = groups.find((x) => x.domain === domainFilter);
                  const unproj = entries.filter((e) => !e.project).length;
                  return (
                    <>
                      {unproj > 0 && (
                        <GroupCard
                          title={`Semua dokumen ${cleanLabel(domainFilter)}`}
                          subtitle="Dokumen tanpa project spesifik"
                          count={unproj}
                          onClick={() => setProjectFilter("__docs__")}
                        />
                      )}
                      {(g?.projects ?? []).map((p) => (
                        <GroupCard
                          key={p.project}
                          title={cleanLabel(p.project)}
                          subtitle="Dokumen project"
                          count={p.count}
                          onClick={() => setProjectFilter(p.project)}
                        />
                      ))}
                    </>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Paging — hanya tampil pada tampilan dokumen */}
        {inProjectView && <PagedBar p={paged} className="mt-4" />}
      </div>

      {editor && (
        <EntryEditor
          draft={editor.draft}
          isNew={editor.isNew}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            load();
          }}
        />
      )}
    </>
  );
}

// ── Vault status → tone (untuk chip filter status vault) ──
function vaultStatusTone(s: string): Tone {
  const v = s.toLowerCase();
  if (v.includes("usulan") || v.includes("proposal") || v.includes("pending"))
    return "warn";
  if (v.includes("tinjau") || v.includes("review")) return "accent";
  if (
    v.includes("kurasi") ||
    v.includes("terbit") ||
    v.includes("publish") ||
    v.includes("approved") ||
    v.includes("active")
  )
    return "up";
  if (v.includes("tolak") || v.includes("reject") || v.includes("archiv") || v.includes("superseded"))
    return "down";
  return "neutral";
}

// ── Group card — satu tingkat drill-down (domain / project) ──
function GroupCard({
  title,
  subtitle,
  count,
  onClick,
}: {
  title: string;
  subtitle?: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <Panel interactive className="p-0">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left px-5 py-4 flex items-center gap-3 transition-colors hover:bg-[var(--surface-1)]/60"
      >
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            color: "var(--accent)",
          }}
        >
          <FolderOpen className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14.5px] font-medium text-[var(--text)] truncate">
              {title}
            </h3>
            <Pill tone="neutral">{count}</Pill>
          </div>
          {subtitle && (
            <p className="text-[12px] text-[var(--text-3)] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--text-3)] shrink-0" />
      </button>
    </Panel>
  );
}

// ── Filter chip (type & status) ───────────────────────────
function FilterChip({
  label,
  count,
  tone = "neutral",
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone?: Tone;
  active: boolean;
  onClick: () => void;
}) {
  const map: Record<Tone, string> = {
    neutral: "var(--text-3)",
    up: "var(--up)",
    down: "var(--down)",
    warn: "var(--warn)",
    accent: "var(--accent)",
  };
  const c = map[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
      style={
        active
          ? {
              color: c,
              background: `color-mix(in srgb, ${c} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
            }
          : {
              color: "var(--text-2)",
              background: "transparent",
              border: "1px solid var(--line)",
            }
      }
    >
      <span className="capitalize">{label}</span>
      <span className="num text-[11px] opacity-70">{count}</span>
    </button>
  );
}
