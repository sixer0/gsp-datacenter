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
  | "fakta";
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
  if (t === "project") return "up";
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
                placeholder="What should Brahma remember?"
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
  const [editor, setEditor] = useState<{ draft: Draft; isNew: boolean } | null>(
    null
  );

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
              Long-term knowledge — Brahma&apos;s memory wiki plus the shared GSP
              workspace (AGENTS.md, MEMORY.md, memory/, docs/). Browse, search,
              and correct.
            </p>
            <p className="num text-[11.5px] text-[var(--text-3)] mt-3">
              synced {timeAgo(lastSync)}
            </p>
          </div>
          <div className="shrink-0">
            <Button variant="primary" onClick={openNew}>
              <Plus className="w-3.5 h-3.5" />
              Usulkan ke librarian
            </Button>
          </div>
        </div>

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

          {/* Type filter chips */}
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
                    : "Once the Brahma bridge is running with a ~/.hermes/wiki, entries appear here."
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
