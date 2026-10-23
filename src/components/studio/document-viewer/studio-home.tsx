"use client";

/*
 * Beranda Studio `/studio` (SR-30; UX-01 W1). Menjawab "apa yang harus saya
 * lakukan", bukan "berapa jumlahnya" (statistik angka besar dihapus):
 * - Perlu perhatian: dokumen Belum lengkap yang berubah dalam 7 hari (maks 5);
 * - Baru lengkap: dokumen Lengkap terbaru dengan Buka PDF / Unduh (maks 5);
 * - Templat: daftar singkat + tautan Buat templat;
 * - Chip mesin cetak (R11): USER = kalimat awam, ADMIN = tautan ke Sistem.
 * Setiap kartu memuat datanya sendiri (isolasi galat); daftar dokumen R04
 * dimuat sekali dan dibagi (dedupe kunci `useStudioQuery`).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, LayoutTemplate } from "lucide-react";
import type { OutputFileDto } from "@/lib/studio/contract/types/api";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { ErrorView } from "@/components/studio/shared/error-view";
import { formatDateTime, missionLabel, versionLabel } from "@/components/studio/shared/labels";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { useViewer } from "@/components/studio/shared/use-viewer";
import { STUDIO_NAV } from "@/lib/studio/contract/ui";
import { getDocument, getRenderEnv, listDocuments, listTemplates } from "./doc-api";
import { fileGroupOf, type DocumentListItem } from "./doc-model";
import { RowCompleteness } from "./document-list";
import { FileActions, FilePreviewDialog } from "./output-files";

const href = (suffix: string, fallback: string) => STUDIO_NAV.find((n) => n.href.endsWith(suffix))?.href ?? fallback;
const DOCS_HREF = href("/documents", "/studio/documents");
const TEMPLATES_HREF = href("/templates", "/studio/templates");
const SYSTEM_HREF = href("/system", "/studio/system");
const WEEK_MS = 7 * 24 * 3600 * 1000;
const MAX_ITEMS = 5;

function useHomeDocuments() {
  return useStudioQuery("home-docs", (signal) => listDocuments({ take: 50 }, signal), { source: "home.documents" });
}

function EngineChip() {
  const { isAdmin } = useViewer();
  const q = useStudioQuery("home-engine", (signal) => getRenderEnv(signal), { source: "home.engine" });
  if (q.isLoading || (q.error && !q.data)) return null;
  const ready = q.data?.readiness?.ready ?? false;
  const pill = <Pill tone={ready ? "up" : "warn"}>{ready ? "Mesin cetak siap" : "Mesin cetak bermasalah"}</Pill>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin ? (
        <Link href={SYSTEM_HREF} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
          {pill}
        </Link>
      ) : (
        pill
      )}
      {!ready && !isAdmin && <span className="text-[12px] text-[var(--text-2)]">Berkas baru mungkin tertunda; hubungi admin.</span>}
    </div>
  );
}

function DocLine({ doc }: { doc: DocumentListItem }) {
  return (
    <li className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <Link
            href={`${DOCS_HREF}/${encodeURIComponent(doc.id)}`}
            className="text-[14px] font-medium text-[var(--text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {doc.title}
          </Link>
          <span className="text-[12px] text-[var(--text-2)]" title={doc.missionFolder ?? undefined}>
            {missionLabel(doc.missionFolder)}
          </span>
        </p>
        <RowCompleteness doc={doc} />
      </div>
    </li>
  );
}

function CompleteLine({ doc }: { doc: DocumentListItem }) {
  const q = useStudioQuery(`doc:${doc.id}`, (signal) => getDocument(doc.id, null, signal), { source: "home.complete-files" });
  const [preview, setPreview] = useState<OutputFileDto | null>(null);
  const full = (q.data?.outputs ?? []).filter((f) => f.role === "PRIMARY" && !fileGroupOf(f).draft);
  const pdf = full.find((f) => f.format === "PDF") ?? null;
  return (
    <li className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <Link
          href={`${DOCS_HREF}/${encodeURIComponent(doc.id)}`}
          className="text-[14px] font-medium text-[var(--text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {doc.title}
        </Link>
        <p className="text-[12px] text-[var(--text-2)]">
          {missionLabel(doc.missionFolder)} · {pdf ? `Berkas lengkap, ${versionLabel(doc.currentRevisionNo).toLowerCase()}` : q.isLoading ? "Memeriksa berkas…" : "Belum ada berkas lengkap"}
        </p>
      </div>
      {pdf && <FileActions file={pdf} onOpen={setPreview} />}
      <FilePreviewDialog file={preview} caption={doc.title} onClose={() => setPreview(null)} />
    </li>
  );
}

function AttentionCard() {
  const q = useHomeDocuments();
  // Jam acuan dibaca sekali saat kartu dipasang (render tetap murni).
  const [now] = useState(() => Date.now());
  const items = useMemo(() => {
    const since = now - WEEK_MS;
    return (q.data?.documents ?? [])
      .filter((d) => d.completeness.status === "INCOMPLETE" && Date.parse(d.updatedAt) >= since)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, MAX_ITEMS);
  }, [q.data, now]);
  return (
    <Panel className="space-y-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow">Perlu perhatian</h2>
        <Button size="sm" href={`${DOCS_HREF}?status=belum`} className="whitespace-nowrap">
          Lihat semua
        </Button>
      </div>
      {q.isLoading && <Skeleton className="h-20 w-full" />}
      {q.error && !q.data && <ErrorView variant="inline" error={q.error} onRetry={q.retry} cooldown={q.cooldown} title="Dokumen tidak dapat dimuat" />}
      {q.data && q.data.documents.length === 0 && (
        <EmptyState
          icon={<FilePlus2 className="h-5 w-5" strokeWidth={2} aria-hidden />}
          title="Belum ada dokumen"
          hint="Dokumen muncul di sini saat agen mengirim bab pertama, atau buat dokumen kosong untuk misi."
          action={
            <Button variant="primary" href={`${DOCS_HREF}?buat=1`}>
              Buat dokumen
            </Button>
          }
        />
      )}
      {q.data && q.data.documents.length > 0 && items.length === 0 && <p className="text-[13px] text-[var(--text-2)]">Tidak ada dokumen belum lengkap yang berubah minggu ini.</p>}
      {items.length > 0 && (
        <ul className="divide-y divide-[var(--line)]">
          {items.map((d) => (
            <DocLine key={d.id} doc={d} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CompleteCard() {
  const q = useHomeDocuments();
  const items = useMemo(
    () => (q.data?.documents ?? []).filter((d) => d.completeness.status === "COMPLETE").sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, MAX_ITEMS),
    [q.data],
  );
  if (!q.data || items.length === 0) return null;
  return (
    <Panel className="space-y-2 p-5">
      <h2 className="eyebrow">Baru lengkap</h2>
      <ul className="divide-y divide-[var(--line)]">
        {items.map((d) => (
          <CompleteLine key={d.id} doc={d} />
        ))}
      </ul>
    </Panel>
  );
}

function TemplatesCard() {
  const q = useStudioQuery("studio-templates", (signal) => listTemplates(signal), { source: "home.templates" });
  const items = (q.data?.templates ?? []).filter((t) => !t.archived && !t.isPreset).slice(0, 6);
  return (
    <Panel className="space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow">Templat</h2>
        <Button size="sm" href={TEMPLATES_HREF} className="whitespace-nowrap">
          <LayoutTemplate className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Buat templat
        </Button>
      </div>
      {q.isLoading && <Skeleton className="h-10 w-full" />}
      {q.error && !q.data && <ErrorView variant="inline" error={q.error} onRetry={q.retry} cooldown={q.cooldown} title="Templat tidak dapat dimuat" />}
      {q.data && items.length === 0 && <p className="text-[13px] text-[var(--text-2)]">Belum ada templat.</p>}
      {items.length > 0 && (
        <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {items.map((t) => (
            <li key={t.id} className="text-[13px]">
              <Link
                href={`${TEMPLATES_HREF}/${encodeURIComponent(t.id)}`}
                className="text-[var(--text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {t.name}
              </Link>
              <span className="text-[var(--text-2)]">
                {" "}
                · {versionLabel(t.latestVersionNo).toLowerCase()} · {formatDateTime(t.updatedAt).split(",")[0]}
              </span>
              {t.isCanonical && (
                <Pill tone="accent" className="ml-2">
                  Kanonik
                </Pill>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function StudioHome() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">Beranda</h1>
        <EngineChip />
      </div>
      <AttentionCard />
      <CompleteCard />
      <TemplatesCard />
    </div>
  );
}
