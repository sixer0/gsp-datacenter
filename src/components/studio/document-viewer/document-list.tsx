"use client";

/*
 * Dokumen per misi `/studio/documents` (SR-30; UX-01 §3b, W5; D-153).
 *
 * - R04 GET (urut terbaru dibuat; kursor "Muat lebih banyak"), dikelompokkan
 *   per misi: "3 dokumen · 1 lengkap".
 * - Baris = satu tautan ke halaman dokumen: judul, nomor, templat, Rel
 *   kelengkapan kecil (R15 per baris, karena ringkasan R04 hanya membawa
 *   status + kunci kurang), ringkasan kekurangan, terakhir diisi oleh siapa.
 * - Filter di URL: `mission` (folder persis -> filter server), `cari` (teks
 *   bebas, klien), `status` (semua / belum / lengkap / masalah), `templat`.
 * - `?buat=1` membuka dialog Buat dokumen (permintaan FIX-4a, palet perintah).
 * - Muat ulang otomatis 30 s hanya bila tab terlihat; tombol "Perbarui".
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilePlus2, FolderOpen, RefreshCw, Search } from "lucide-react";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { CompletenessRail } from "@/components/studio/shared/completeness-rail";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { COMPLETENESS_STATUS_LABEL, RELEASE_LABEL, RELEASE_TONE, actorLabel, formatDateTime, missionLabel, slotLabel } from "@/components/studio/shared/labels";
import { RefreshingIndicator } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { STUDIO_NAV } from "@/lib/studio/contract/ui";
import type { CompletenessReportV2 } from "@/lib/studio/contract";
import { getCompleteness, listDocuments, listTemplates } from "./doc-api";
import { MISSION_FOLDER_RE, briefMissingLabels, missingLabels, type DocumentListItem, type DocumentListResponse } from "./doc-model";
import { CreateDocumentDialog } from "./create-document-dialog";

const DOCS_HREF = STUDIO_NAV.find((n) => n.href.endsWith("/documents"))?.href ?? "/studio/documents";
const PAGE_TAKE = 25;
const AUTO_REFRESH_MS = 30_000;
const NO_MISSION = "__tanpa_misi__";

type StatusFilter = "" | "belum" | "lengkap" | "masalah";
const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "", label: "Semua" },
  { id: "belum", label: "Belum lengkap" },
  { id: "lengkap", label: "Lengkap" },
  { id: "masalah", label: "Ada masalah standar" },
];

const FIELD =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function lastFilled(report: CompletenessReportV2): { what: string; by: string; at: string } | null {
  let best: { what: string; by: string; at: string } | null = null;
  for (const s of report.slots) {
    if (!s.lastFilledAt || !s.lastFilledBy) continue;
    if (!best || s.lastFilledAt > best.at) best = { what: slotLabel(s.slotKey, s.label), by: s.lastFilledBy, at: s.lastFilledAt };
  }
  for (const [slotKey, prog] of Object.entries(report.chapters ?? {})) {
    const appendix = report.slots.find((x) => x.slotKey === slotKey)?.sectionType === "appendix";
    for (const p of prog.present) {
      if (!best || p.at > best.at) best = { what: `${appendix ? "Lampiran" : "Bab"} ${p.key}`, by: p.by, at: p.at };
    }
  }
  return best;
}

export function RowCompleteness({ doc }: { doc: DocumentListItem }) {
  const q = useStudioQuery(`doc-completeness:${doc.id}:${doc.currentRevisionNo}`, (signal) => getCompleteness(doc.id, signal), {
    source: "documents.list-completeness",
  });
  const report = q.data?.completeness ?? null;
  const missing = report ? missingLabels(report) : briefMissingLabels(doc.completeness.missingRequired);
  const last = report ? lastFilled(report) : null;
  return (
    <div className="space-y-1">
      {report && report.slots.length > 0 ? (
        <CompletenessRail summary={report} size="list" className="max-w-[22rem]" />
      ) : q.isLoading ? (
        <Skeleton className="h-[6px] w-full max-w-[22rem]" />
      ) : null}
      <p className="text-[12.5px] text-[var(--text-2)]">
        {doc.completeness.status === "COMPLETE" ? (
          <span className="text-[var(--text)]">Lengkap</span>
        ) : missing.length ? (
          <>Belum: {missing.slice(0, 4).join(", ")}{missing.length > 4 ? `, dan ${missing.length - 4} lainnya` : ""}</>
        ) : (
          COMPLETENESS_STATUS_LABEL[doc.completeness.status]
        )}
      </p>
      {last && (
        <p className="text-[12px] text-[var(--text-2)]">
          Terakhir: {last.what} oleh {actorLabel(last.by)}, {formatDateTime(last.at)}
        </p>
      )}
    </div>
  );
}

function DocumentRow({ doc, templateName }: { doc: DocumentListItem; templateName: string | null }) {
  return (
    <li>
      <Link
        href={`${DOCS_HREF}/${encodeURIComponent(doc.id)}`}
        className="grid gap-2 px-4 py-3.5 hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5"
      >
        <div className="min-w-0 space-y-1.5">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[14px] font-medium text-[var(--text)]">{doc.title}</span>
            <span className="num text-[12px] text-[var(--text-2)]">{doc.docNumber}</span>
            {templateName && <span className="text-[12px] text-[var(--text-2)]">{templateName}</span>}
          </p>
          <RowCompleteness doc={doc} />
        </div>
        <div className="flex flex-wrap items-start gap-2 sm:justify-end">
          <Pill tone={doc.completeness.status === "COMPLETE" ? "up" : "warn"}>{COMPLETENESS_STATUS_LABEL[doc.completeness.status]}</Pill>
          {doc.releaseStatus && doc.releaseStatus !== "NOT_RUN" && <Pill tone={RELEASE_TONE[doc.releaseStatus]}>{RELEASE_LABEL[doc.releaseStatus]}</Pill>}
        </div>
      </Link>
    </li>
  );
}

interface Group {
  key: string;
  folder: string | null;
  docs: DocumentListItem[];
  latest: string;
}

function groupByMission(docs: readonly DocumentListItem[]): Group[] {
  const map = new Map<string, Group>();
  for (const d of docs) {
    const key = d.missionFolder ?? NO_MISSION;
    const g = map.get(key) ?? { key, folder: d.missionFolder, docs: [], latest: d.updatedAt };
    g.docs.push(d);
    if (d.updatedAt > g.latest) g.latest = d.updatedAt;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => (a.latest < b.latest ? 1 : -1));
}

export function DocumentList() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const mission = sp.get("mission") ?? "";
  const cari = sp.get("cari") ?? "";
  const statusRaw = sp.get("status") ?? "";
  const status: StatusFilter = STATUS_OPTIONS.some((o) => o.id === statusRaw) ? (statusRaw as StatusFilter) : "";
  const templat = sp.get("templat") ?? "";
  const createOpen = sp.get("buat") === "1";
  const serverMission = MISSION_FOLDER_RE.test(mission) ? mission : "";

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, sp],
  );

  const first = useStudioQuery(`doc-list:${serverMission}`, (signal) => listDocuments({ mission: serverMission || undefined, take: PAGE_TAKE }, signal), {
    source: "documents.list",
  });
  const templates = useStudioQuery("studio-templates", (signal) => listTemplates(signal), { source: "documents.templates" });
  const templateNames = useMemo(() => new Map((templates.data?.templates ?? []).map((t) => [t.id, t.name])), [templates.data]);

  // Halaman tambahan (kursor), diatur ulang saat halaman pertama berubah.
  const [more, setMore] = useState<{ base: DocumentListResponse | undefined; docs: DocumentListItem[]; cursor: string | null } | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const active = more && more.base === first.data ? more : null;
  const extraDocs = useMemo(() => active?.docs ?? [], [active]);
  const cursor = active ? active.cursor : first.data?.nextCursor ?? null;

  async function loadMore() {
    if (!cursor || moreBusy) return;
    setMoreBusy(true);
    setMoreError(null);
    try {
      const r = await listDocuments({ mission: serverMission || undefined, take: PAGE_TAKE, cursor });
      setMore({ base: first.data, docs: [...extraDocs, ...r.documents], cursor: r.nextCursor });
    } catch (e) {
      const m = errorMessages(e);
      setMoreError(`${m.title}. ${m.body}`);
    } finally {
      setMoreBusy(false);
    }
  }

  // Muat ulang otomatis bila tab terlihat.
  const { refetch } = first;
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && !createOpen) refetch();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refetch, createOpen]);

  const all = useMemo(() => [...(first.data?.documents ?? []), ...extraDocs], [first.data, extraDocs]);
  const knownMissions = useMemo(() => [...new Set(all.map((d) => d.missionFolder).filter((m): m is string => !!m))], [all]);
  const filtered = useMemo(() => {
    const needle = cari.trim().toLowerCase();
    return all.filter((d) => {
      if (needle) {
        const hay = `${d.title} ${d.docNumber} ${d.missionFolder ?? ""} ${missionLabel(d.missionFolder)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (status === "belum" && d.completeness.status !== "INCOMPLETE") return false;
      if (status === "lengkap" && d.completeness.status !== "COMPLETE") return false;
      if (status === "masalah" && d.releaseStatus !== "FAIL") return false;
      if (templat && d.templateId !== templat) return false;
      return true;
    });
  }, [all, cari, status, templat]);
  const groups = useMemo(() => groupByMission(filtered), [filtered]);
  const hasFilter = !!(mission || cari || status || templat);

  const [search, setSearch] = useState(cari || mission);
  const applySearch = () => {
    const v = search.trim();
    if (MISSION_FOLDER_RE.test(v)) setParams({ mission: v, cari: null });
    else setParams({ cari: v || null, mission: null });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">Dokumen</h1>
          <p className="mt-1 text-[13px] text-[var(--text-2)]">Dokumen misi yang diisi agen. Pantau kelengkapan, tinjau isi, dan buat berkas.</p>
        </div>
        <Button variant="primary" onClick={() => setParams({ buat: "1" })} className="whitespace-nowrap">
          <FilePlus2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          Buat dokumen
        </Button>
      </div>

      <form
        role="search"
        aria-label="Saring dokumen"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_12rem_auto] sm:items-end"
      >
        <label className="space-y-1 text-[12px] text-[var(--text-2)]">
          Cari misi atau judul
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-3)]" strokeWidth={2} aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onBlur={applySearch} placeholder="Misi A, laporan inspeksi…" className={`${FIELD} pl-8`} />
          </span>
        </label>
        <label className="space-y-1 text-[12px] text-[var(--text-2)]">
          Status
          <select value={status} onChange={(e) => setParams({ status: e.target.value || null })} className={FIELD}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-[12px] text-[var(--text-2)]">
          Templat
          <select value={templat} onChange={(e) => setParams({ templat: e.target.value || null })} className={FIELD}>
            <option value="">Semua</option>
            {(templates.data?.templates ?? [])
              .filter((t) => !t.isPreset)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button onClick={() => first.refetch()} className="whitespace-nowrap">
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Perbarui
          </Button>
          <RefreshingIndicator active={first.isRefreshing} />
        </div>
      </form>

      {first.isLoading && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <Panel key={i} className="space-y-3 p-5">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Panel>
          ))}
        </div>
      )}

      {first.error && !first.data && <ErrorView error={first.error} title="Daftar dokumen tidak dapat dimuat" onRetry={first.retry} cooldown={first.cooldown} />}

      {first.data && groups.length === 0 && (
        <Panel className="p-6">
          {hasFilter ? (
            <EmptyState
              title="Tidak ada dokumen yang cocok dengan filter."
              action={
                <Button
                  onClick={() => {
                    setSearch("");
                    setParams({ mission: null, cari: null, status: null, templat: null });
                  }}
                >
                  Hapus filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<FolderOpen className="h-5 w-5" strokeWidth={2} aria-hidden />}
              title="Belum ada dokumen"
              hint="Agen membuat dokumen saat mengirim bab pertama untuk misi, atau Anda dapat membuat dokumen kosong lebih dulu."
              action={<Button onClick={() => setParams({ buat: "1" })}>Buat dokumen</Button>}
            />
          )}
        </Panel>
      )}

      {groups.map((g) => {
        const complete = g.docs.filter((d) => d.completeness.status === "COMPLETE").length;
        return (
          <Panel key={g.key} className="p-0">
            <section aria-label={g.folder ? missionLabel(g.folder) : "Tanpa misi"}>
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] px-4 py-3 sm:px-5">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text)]" title={g.folder ?? undefined}>
                  {g.folder ? missionLabel(g.folder) : "Tanpa misi"}
                </h2>
                <p className="num text-[12px] text-[var(--text-2)]">
                  {g.docs.length} dokumen · {complete} lengkap
                </p>
              </header>
              <ul className="divide-y divide-[var(--line)]">
                {g.docs.map((d) => (
                  <DocumentRow key={d.id} doc={d} templateName={templateNames.get(d.templateId) ?? null} />
                ))}
              </ul>
            </section>
          </Panel>
        );
      })}

      {first.data && cursor && (
        <div className="flex flex-col items-center gap-2">
          <Button onClick={() => void loadMore()} ariaDisabled={moreBusy} className="whitespace-nowrap">
            {moreBusy ? "Memuat…" : "Muat lebih banyak"}
          </Button>
          {moreError && (
            <p role="alert" className="text-[12.5px] text-[var(--down)]">
              {moreError}
            </p>
          )}
        </div>
      )}

      {createOpen && (
        <CreateDocumentDialog open onClose={() => setParams({ buat: null })} knownMissions={knownMissions} initialMission={serverMission || undefined} />
      )}
    </div>
  );
}
