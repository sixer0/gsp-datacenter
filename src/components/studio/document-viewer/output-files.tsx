"use client";

/*
 * Berkas dokumen (SR-30; UX-01 §3d, W9): tab Berkas, tombol Buka/Unduh, dan
 * dialog pratinjau.
 *
 * - Buka = pratinjau di dalam Studio (`fileUrl(f, "inline")`), "Buka di tab baru"
 *   sekunder. Unduh = `fileUrl(f, "download")` (attachment). Tidak ada tombol
 *   Buka yang mengunduh (S86 R06). Word hanya Unduh + tautan ke PDF versi sama.
 * - Keamanan pratinjau (SEC-1/SEC-2 dipertahankan): HTML dan SVG di iframe
 *   `sandbox=""` + `title`; PDF memakai `<object type="application/pdf">` dengan
 *   cadangan tautan, hanya bila `mime` = application/pdf.
 * - Berkas dikelompokkan per versi dokumen (terbaru di atas): Berkas lengkap,
 *   draf (bertanda DRAF), lalu gambar.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, ExternalLink, Eye, FileText } from "lucide-react";
import type { OutputFileDto } from "@/lib/studio/contract/types/api";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { canOpenInline, fileUrl } from "@/components/studio/shared/file-url";
import { Sheet } from "@/components/studio/shared/dialog";
import { ErrorView } from "@/components/studio/shared/error-view";
import { FORMAT_LABEL, formatBytes, formatDateTime, versionLabel } from "@/components/studio/shared/labels";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { getDocument, listRevisions } from "./doc-api";
import { fileGroupOf, type FileGroupInfo } from "./doc-model";
import { useDocPage } from "./doc-context";

const FORMAT_ORDER: Record<string, number> = { PDF: 0, DOCX: 1, HTML: 2, SVG: 3, PNG: 4 };
const LINK_BTN =
  "btn-ghost inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-[12px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function formatLabel(f: OutputFileDto): string {
  return FORMAT_LABEL[f.format] ?? f.format;
}

// ── Pratinjau ────────────────────────────────────────────────────────────

function PreviewBody({ file }: { file: OutputFileDto }) {
  const src = fileUrl(file, "inline");
  if (!src) return <p className="text-[13px] text-[var(--text-2)]">Berkas ini tidak dapat dipratinjau. Gunakan Unduh.</p>;
  const title = `Pratinjau ${file.fileName}`;
  const frameCls = "h-[70dvh] w-full rounded-[10px] border border-[var(--line)] bg-white";
  if (file.format === "PDF") {
    if (file.mime !== "application/pdf") {
      return <p className="text-[13px] text-[var(--text-2)]">Jenis berkas tidak sesuai PDF, jadi pratinjau dimatikan. Gunakan Unduh.</p>;
    }
    return (
      <object data={src} type="application/pdf" aria-label={title} className={frameCls}>
        <p className="p-4 text-[13px] text-[var(--text-2)]">
          Peramban tidak dapat menampilkan PDF di sini.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">
            Buka PDF di tab baru
          </a>
          .
        </p>
      </object>
    );
  }
  if (file.format === "PNG") {
    // eslint-disable-next-line @next/next/no-img-element -- berkas dinamis dari route berkas Studio, bukan aset statis
    return <img src={src} alt={file.figureLabel ?? file.fileName} className="mx-auto max-h-[70dvh] max-w-full rounded-[10px] bg-white" />;
  }
  return <iframe src={src} title={title} sandbox="" referrerPolicy="no-referrer" loading="lazy" className={frameCls} />;
}

export function FilePreviewDialog({ file, caption, onClose }: { file: OutputFileDto | null; caption?: string; onClose: () => void }) {
  const tab = file ? fileUrl(file, "inline") : null;
  const dl = file ? fileUrl(file, "download") : null;
  return (
    <Sheet
      open={!!file}
      onClose={onClose}
      placement="center"
      title={file ? `${caption ?? file.fileName} · ${formatLabel(file)}` : "Pratinjau berkas"}
      footer={
        file ? (
          <>
            {tab && (
              <a href={tab} target="_blank" rel="noopener noreferrer" className={LINK_BTN}>
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Buka di tab baru
              </a>
            )}
            {dl && (
              <a href={dl} className={LINK_BTN}>
                <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Unduh
              </a>
            )}
          </>
        ) : null
      }
    >
      {file && <PreviewBody file={file} />}
    </Sheet>
  );
}

/**
 * Tombol Buka (bila dapat dipratinjau) + Unduh untuk satu berkas. Word: hanya
 * Unduh dan catatan yang menautkan ke PDF versi sama bila ada.
 */
export function FileActions({
  file,
  pdfSibling,
  onOpen,
}: {
  file: OutputFileDto;
  pdfSibling?: OutputFileDto | null;
  onOpen: (f: OutputFileDto) => void;
}) {
  const dl = fileUrl(file, "download");
  const inline = canOpenInline(file.format);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {inline && (
        <Button size="sm" onClick={() => onOpen(file)} className="whitespace-nowrap">
          <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Buka
        </Button>
      )}
      {dl && (
        <Button size="sm" href={dl} className="whitespace-nowrap">
          <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Unduh
        </Button>
      )}
      {file.format === "DOCX" && (
        <span className="text-[12px] text-[var(--text-2)]">
          Word tidak dapat dipratinjau di peramban.
          {pdfSibling && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => onOpen(pdfSibling)}
                className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Lihat versi PDF
              </button>
            </>
          )}
        </span>
      )}
    </div>
  );
}

// ── Kelompok berkas satu versi ───────────────────────────────────────────

interface FileGroup {
  info: FileGroupInfo;
  files: OutputFileDto[];
}

function groupFiles(files: readonly OutputFileDto[], slotLabels: ReadonlyMap<string, string>): FileGroup[] {
  const map = new Map<string, FileGroup>();
  for (const f of files) {
    const info = fileGroupOf(f, slotLabels);
    const g = map.get(info.label) ?? { info, files: [] };
    g.files.push(f);
    map.set(info.label, g);
  }
  const rank: Record<FileGroupInfo["kind"], number> = { full: 0, chapterDraft: 1, appendixDraft: 2, slotDraft: 3, figure: 4 };
  return [...map.values()]
    .sort((a, b) => rank[a.info.kind] - rank[b.info.kind] || a.info.label.localeCompare(b.info.label, "id", { numeric: true }))
    .map((g) => ({ ...g, files: [...g.files].sort((a, b) => (FORMAT_ORDER[a.format] ?? 9) - (FORMAT_ORDER[b.format] ?? 9)) }));
}

function FigureRows({ group, onOpen }: { group: FileGroup; onOpen: (f: OutputFileDto, caption: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md py-1 text-[12.5px] text-[var(--text-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
        Gambar dalam dokumen ({group.files.length})
      </button>
      {open && (
        <ul className="mt-1 divide-y divide-[var(--line)]">
          {group.files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="text-[13px] text-[var(--text)]">
                {f.figureLabel ?? "Gambar"}{" "}
                <span className="text-[var(--text-2)]">
                  · {formatLabel(f)} · {formatBytes(f.bytes)}
                </span>
              </span>
              <FileActions file={f} onOpen={(x) => onOpen(x, f.figureLabel ?? "Gambar")} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileRows({ group, title, onOpen }: { group: FileGroup; title: string; onOpen: (f: OutputFileDto, caption: string) => void }) {
  if (group.info.kind === "figure") return <FigureRows group={group} onOpen={onOpen} />;
  const pdf = group.files.find((f) => f.format === "PDF") ?? null;
  const caption = group.info.draft ? group.info.label : title;
  return (
    <ul className="divide-y divide-[var(--line)]">
      {group.files.map((f) => (
        <li key={f.id} className="grid gap-2 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-[var(--text)]">{caption}</p>
            <p className="text-[12px] text-[var(--text-2)]">
              {formatLabel(f)}
              {group.info.draft ? " · Bertanda DRAF di setiap halaman" : ""} · <span className="num">{formatBytes(f.bytes)}</span> · {formatDateTime(f.createdAt)}
            </p>
          </div>
          <FileActions file={f} pdfSibling={f.format === "DOCX" ? pdf : null} onOpen={(x) => onOpen(x, caption)} />
        </li>
      ))}
    </ul>
  );
}

export function VersionFiles({
  versionNo,
  when,
  files,
  title,
  slotLabels,
  onOpen,
}: {
  versionNo: number;
  when?: string | null;
  files: readonly OutputFileDto[];
  title: string;
  slotLabels: ReadonlyMap<string, string>;
  onOpen: (f: OutputFileDto, caption: string) => void;
}) {
  const groups = useMemo(() => groupFiles(files, slotLabels), [files, slotLabels]);
  if (groups.length === 0) return <p className="text-[12.5px] text-[var(--text-2)]">Belum ada berkas untuk versi ini.</p>;
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.info.label} className="space-y-1">
          {g.info.kind !== "figure" && (
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={g.info.draft ? "warn" : "up"}>{g.info.label}</Pill>
              <span className="text-[12px] text-[var(--text-2)]">
                {versionLabel(versionNo)}
                {when ? ` · ${formatDateTime(when)}` : ""}
              </span>
            </div>
          )}
          <FileRows group={g} title={title} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}

function OlderVersion({ id, revisionNo, when, title }: { id: string; revisionNo: number; when: string; title: string }) {
  const { slotLabels } = useDocPage();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ f: OutputFileDto; caption: string } | null>(null);
  const q = useStudioQuery(open ? `doc:${id}:rev:${revisionNo}` : null, (signal) => getDocument(id, revisionNo, signal), {
    source: "documents.files-version",
  });
  return (
    <li className="py-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md py-1 text-[13px] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
        {versionLabel(revisionNo)} <span className="text-[12px] text-[var(--text-2)]">· {formatDateTime(when)}</span>
      </button>
      {open && (
        <div className="mt-2 pl-5">
          {q.isLoading && <Skeleton className="h-10 w-full" />}
          {q.error && !q.data && (
            <ErrorView variant="inline" error={q.error} onRetry={q.retry} cooldown={q.cooldown} title="Berkas versi ini tidak dapat dimuat" />
          )}
          {q.data && (
            <VersionFiles versionNo={revisionNo} files={q.data.outputs} title={title} slotLabels={slotLabels} onOpen={(f, caption) => setPreview({ f, caption })} />
          )}
        </div>
      )}
      <FilePreviewDialog file={preview?.f ?? null} caption={preview?.caption} onClose={() => setPreview(null)} />
    </li>
  );
}

/** Tab Berkas (W9). */
export function FilesTab() {
  const { id, detail, slotLabels, latestRevisionNo } = useDocPage();
  const [preview, setPreview] = useState<{ f: OutputFileDto; caption: string } | null>(null);
  const [showOlder, setShowOlder] = useState(false);
  const history = useStudioQuery(showOlder ? `doc-history:${id}` : null, (signal) => listRevisions(id, signal), {
    source: "documents.files-history",
  });
  const d = detail.data;
  if (!d) return null;
  const title = d.document.title;
  const older = (history.data?.revisions ?? []).filter((r) => r.revisionNo !== latestRevisionNo);

  return (
    <div className="space-y-4">
      <Panel className="space-y-3 p-4 sm:p-5">
        {d.outputs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" strokeWidth={2} aria-hidden />}
            title="Belum ada berkas untuk versi terbaru"
            hint="Gunakan kartu Buat berkas di atas. Berkas lengkap tersedia setelah semua bagian wajib terisi; draf bab atau bagian bisa dibuat kapan saja."
          />
        ) : (
          <VersionFiles
            versionNo={d.revision.revisionNo}
            when={d.revision.createdAt}
            files={d.outputs}
            title={title}
            slotLabels={slotLabels}
            onOpen={(f, caption) => setPreview({ f, caption })}
          />
        )}
      </Panel>

      <Panel className="space-y-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-medium text-[var(--text)]">Berkas versi sebelumnya</h3>
          {!showOlder && (
            <Button size="sm" onClick={() => setShowOlder(true)} className="whitespace-nowrap">
              Tampilkan
            </Button>
          )}
        </div>
        {showOlder && history.isLoading && <Skeleton className="h-16 w-full" />}
        {showOlder && history.error && !history.data && (
          <ErrorView variant="inline" error={history.error} onRetry={history.retry} cooldown={history.cooldown} title="Daftar versi tidak dapat dimuat" />
        )}
        {showOlder && history.data && older.length === 0 && <p className="text-[12.5px] text-[var(--text-2)]">Belum ada versi sebelumnya.</p>}
        {showOlder && older.length > 0 && (
          <ul className="divide-y divide-[var(--line)]">
            {older.map((r) => (
              <OlderVersion key={r.revisionNo} id={id} revisionNo={r.revisionNo} when={r.createdAt} title={title} />
            ))}
          </ul>
        )}
      </Panel>

      <FilePreviewDialog file={preview?.f ?? null} caption={preview?.caption} onClose={() => setPreview(null)} />
    </div>
  );
}
