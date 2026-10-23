"use client";

/*
 * Tabel pembuatan berkas terbaru (StudioRenderJob, S102; ADMIN): saring status,
 * galat ringkas, dan detail log (`engine.log`, tanpa stack trace) per baris.
 * FIX-4b: label bersama kamus UX-01 §1.2 ("Pembuatan berkas"), id dan pesan
 * server mentah di Info teknis.
 */

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ListChecks } from "lucide-react";
import { EmptyState, Panel, Pill } from "@/components/ui/kit";
import { STUDIO_RENDER_JOB_STATUSES, type StudioRenderJobStatus } from "@/lib/studio/contract/enums";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { FILE_JOB_LABEL as JOB_LABEL, FILE_JOB_TONE as JOB_TONE, FORMAT_LABEL, formatDateTime } from "@/components/studio/shared/labels";
import type { RenderJobLogLine, RenderJobStatusDto } from "./types";

export type JobFilter = "ALL" | "ACTIVE" | "PROBLEM" | StudioRenderJobStatus;

export const FILTER_STATUSES: Record<JobFilter, readonly StudioRenderJobStatus[]> = {
  ALL: [],
  ACTIVE: ["QUEUED", "RUNNING"],
  PROBLEM: ["FAILED", "PARTIAL"],
  QUEUED: ["QUEUED"],
  RUNNING: ["RUNNING"],
  FAILED: ["FAILED"],
  PARTIAL: ["PARTIAL"],
  SUCCEEDED: ["SUCCEEDED"],
};

const FILTER_LABEL: Record<JobFilter, string> = {
  ALL: "Semua",
  ACTIVE: "Aktif",
  PROBLEM: "Bermasalah",
  ...JOB_LABEL,
};

const FILTER_ORDER: JobFilter[] = ["ALL", "ACTIVE", "PROBLEM", "QUEUED", "RUNNING", "FAILED", "PARTIAL", "SUCCEEDED"];

function filterCount(filter: JobFilter, counts: Record<StudioRenderJobStatus, number> | undefined): number | null {
  if (!counts) return null;
  const list = FILTER_STATUSES[filter];
  const statuses = list.length ? list : STUDIO_RENDER_JOB_STATUSES;
  return statuses.reduce((n, s) => n + (counts[s] ?? 0), 0);
}

const LEVEL_COLOR: Record<RenderJobLogLine["level"], string> = {
  info: "var(--text-3)",
  warn: "var(--warn)",
  error: "var(--down)",
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "-";
  return ms < 1000 ? `${ms} md` : `${(ms / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} dtk`;
}

function timeOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "-";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function Target({ job }: { job: RenderJobStatusDto }) {
  if (job.documentId) {
    return (
      <Link href={`/studio/documents/${encodeURIComponent(job.documentId)}`} className={`rounded text-[var(--accent)] hover:underline ${FOCUS}`}>
        Dokumen
        <span className="sr-only"> {job.documentId}</span>
      </Link>
    );
  }
  if (job.artifactId) {
    return (
      <Link href="/studio/artifacts" className={`rounded text-[var(--accent)] hover:underline ${FOCUS}`}>
        Artefak
        <span className="sr-only"> {job.artifactId}</span>
      </Link>
    );
  }
  return <span className="text-[var(--text-2)]">-</span>;
}

function JobDetail({ job, id }: { job: RenderJobStatusDto; id: string }) {
  return (
    <div id={id} className="space-y-3 bg-[var(--surface-2)] px-4 py-3">
      <dl className="grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[var(--text-2)]">Mulai / selesai</dt>
          <dd className="text-[var(--text-2)]">
            {formatDateTime(job.startedAt)} / {formatDateTime(job.finishedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-2)]">Mesin</dt>
          <dd className="text-[var(--text-2)]">
            {job.engine?.sofficeVersion ? `LibreOffice ${job.engine.sofficeVersion}` : "-"}
            {job.engine?.chromiumRevision ? ` · Chromium ${job.engine.chromiumRevision}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-2)]">Diminta oleh</dt>
          <dd className="text-[var(--text-2)] break-all">{job.requestedBy}</dd>
        </div>
      </dl>

      {job.errors && job.errors.length > 0 && (
        <div>
          <h4 className="text-[12px] font-semibold text-[var(--text)]">Galat per format</h4>
          <ul className="mt-1 space-y-1 text-[12px]">
            {job.errors.map((e, i) => (
              <li key={`${i}-${e.code}`} className="text-[var(--text-2)]">
                {e.format && <span className="mr-1.5 font-medium text-[var(--text)]">[{e.format}]</span>}
                <span className="font-mono text-[11.5px] text-[var(--down)]">{e.code}</span>
                {e.message ? <span>: {e.message}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <InfoTeknis items={{ "Id pembuatan": job.id, Dokumen: job.documentId, Artefak: job.artifactId }} />

      <div>
        <h4 className="text-[12px] font-semibold text-[var(--text)]">
          Catatan mesin ({job.logTail.length} entri terakhir dari {job.logTotal}
          {job.logDropped > 0 ? `, ${job.logDropped} dibuang karena batas` : ""})
        </h4>
        {job.logTail.length === 0 ? (
          <p className="mt-1 text-[12px] text-[var(--text-2)]">Belum ada catatan untuk pembuatan ini.</p>
        ) : (
          <ol className="mt-1 max-h-72 overflow-auto rounded-md border border-[var(--line)] bg-[var(--surface-1)] p-2 font-mono text-[11.5px] leading-relaxed">
            {job.logTail.map((l, i) => (
              <li key={`${i}-${l.timestamp}`} className="flex gap-2 break-words">
                <span className="shrink-0 text-[var(--text-4)]">{timeOnly(l.timestamp)}</span>
                <span className="w-11 shrink-0 uppercase" style={{ color: LEVEL_COLOR[l.level] }}>
                  {l.level}
                </span>
                <span className="min-w-0 text-[var(--text-2)]">
                  {l.code && <span className="mr-1.5 text-[var(--text)]">{l.code}</span>}
                  {l.message}
                  {l.address && <span className="ml-1.5 text-[var(--text-2)]">@{l.address}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export function JobsSection({
  jobs,
  counts,
  jobsError,
  filter,
  onFilter,
  loading,
}: {
  jobs: RenderJobStatusDto[];
  counts: Record<StudioRenderJobStatus, number> | undefined;
  jobsError?: string;
  filter: JobFilter;
  onFilter: (f: JobFilter) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-labelledby="jobs-heading">
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="jobs-heading" className="text-[15px] font-semibold text-[var(--text)]">
            Pembuatan berkas terbaru
          </h2>
          {loading && (
            <span className="text-[12px] text-[var(--text-2)]" aria-live="polite">
              Memuat...
            </span>
          )}
        </div>

        <div role="group" aria-label="Saring pembuatan berkas menurut status" className="mt-3 flex flex-wrap gap-1.5">
          {FILTER_ORDER.map((f) => {
            const n = filterCount(f, counts);
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(f)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${FOCUS} ${
                  active
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "border border-[var(--line)] text-[var(--text-2)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
                }`}
              >
                {FILTER_LABEL[f]}
                {n !== null && <span className="ml-1 opacity-70">{n}</span>}
              </button>
            );
          })}
        </div>

        {jobsError ? (
          <p role="alert" className="mt-4 text-[13px] text-[var(--down)]">
            Daftar pembuatan berkas gagal dimuat. Kesiapan mesin di atas tetap terkini; coba muat ulang sebentar lagi.
          </p>
        ) : null}
        {jobsError ? (
          <InfoTeknis className="mt-2" items={{ "Pesan server": jobsError }} />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" aria-hidden />}
            title={filter === "ALL" ? "Belum ada pembuatan berkas" : `Tidak ada pembuatan berkas berstatus "${FILTER_LABEL[filter].toLowerCase()}"`}
            hint="Daftar ini terisi saat berkas dokumen atau artefak dibuat."
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
              <caption className="sr-only">
                {jobs.length} pembuatan berkas terbaru, diurutkan dari yang terakhir masuk antrean
              </caption>
              <thead>
                <tr className="border-b border-[var(--line)] text-[11.5px] uppercase tracking-wide text-[var(--text-2)]">
                  <th scope="col" className="w-8 py-2 pr-2 font-medium">
                    <span className="sr-only">Detail</span>
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">Masuk antrean</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Sasaran</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Format</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Durasi</th>
                  <th scope="col" className="py-2 font-medium">Galat</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const isOpen = open.has(job.id);
                  const detailId = `job-detail-${job.id}`;
                  return (
                    <Fragment key={job.id}>
                      <tr className="border-b border-[var(--line)] align-top">
                        <td className="py-2 pr-2">
                          <button
                            type="button"
                            onClick={() => toggle(job.id)}
                            aria-expanded={isOpen}
                            aria-controls={isOpen ? detailId : undefined}
                            className={`rounded p-1 text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] ${FOCUS}`}
                          >
                            {isOpen ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                            <span className="sr-only">{isOpen ? "Tutup" : "Buka"} detail pembuatan berkas {formatDateTime(job.queuedAt)}</span>
                          </button>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-[var(--text-2)]">{formatDateTime(job.queuedAt)}</td>
                        <td className="py-2 pr-3">
                          <Pill tone={JOB_TONE[job.status]}>{JOB_LABEL[job.status]}</Pill>
                        </td>
                        <td className="py-2 pr-3">
                          <Target job={job} />
                        </td>
                        <td className="py-2 pr-3 text-[var(--text-2)]">{job.formats.map((f) => FORMAT_LABEL[f] ?? f).join(", ") || "-"}</td>
                        <td className="py-2 pr-3 whitespace-nowrap text-[var(--text-2)]">{formatDuration(job.durationMs)}</td>
                        <td className="py-2 text-[var(--text-2)]">
                          {job.errorSummary ? (
                            <span>
                              {job.errorCode && <span className="mr-1.5 font-mono text-[11.5px] text-[var(--down)]">{job.errorCode}</span>}
                              <span className="line-clamp-2">{job.errorSummary}</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-2)]">-</span>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-[var(--line)]">
                          <td colSpan={7} className="p-0">
                            <JobDetail job={job} id={detailId} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </section>
  );
}
