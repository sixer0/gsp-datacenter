"use client";

/*
 * Halaman Sistem `/studio/system` (S102, D-23; W12 FIX-4b).
 * - ADMIN: panel kesiapan mesin cetak lengkap dengan judul awam ("Mesin cetak
 *   Word/PDF", "Huruf terpasang", "Pembuat PDF dari halaman web", "Antrean"),
 *   daftar pembuatan berkas terbaru dengan log, dan "Periksa ulang kesiapan".
 * - USER: satu kartu status awam (siap / bermasalah).
 * Data dari R11 `/api/studio/render-env` (hanya baca). Peran dari `useViewer`
 * (penyembunyian hanya kenyamanan; `refresh=1` tetap ditolak server untuk USER).
 * Boundary galat: `app/studio/error.tsx` (boundary lokal lama dipensiunkan, UX-01 §6.4).
 */

import { useState } from "react";
import { CheckCircle2, CircleSlash, RefreshCw, ShieldCheck } from "lucide-react";
import { Panel, Skeleton } from "@/components/ui/kit";
import { ErrorView } from "@/components/studio/shared/error-view";
import { formatDateTime } from "@/components/studio/shared/labels";
import { useViewer } from "@/components/studio/shared/use-viewer";
import { JobsSection, FILTER_STATUSES, type JobFilter } from "./jobs";
import { ReadinessSection } from "./readiness";
import type { RenderEnvStatusResponse } from "./types";
import { POLL_MS, useRenderEnv } from "./use-render-env";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function PanelSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) return <Skeleton className="h-24 w-full" />;
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat status mesin cetak">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Kartu tunggal untuk USER (W12). */
function UserStatusCard({ data }: { data: RenderEnvStatusResponse }) {
  const ready = data.readiness.ready;
  const time = formatDateTime(data.readiness.checkedAt).split(", ")[1] ?? formatDateTime(data.readiness.checkedAt);
  return (
    <Panel className="p-5">
      <div role="status" className="flex items-start gap-3">
        {ready ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--up)]" strokeWidth={2} aria-hidden />
        ) : (
          <CircleSlash className="mt-0.5 h-5 w-5 shrink-0 text-[var(--down)]" strokeWidth={2} aria-hidden />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-[14px] font-semibold text-[var(--text)]">{ready ? "Mesin cetak siap" : "Mesin cetak bermasalah"}</p>
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            {ready
              ? "Berkas dibuat normal."
              : `Masalah terlihat pada pemeriksaan pukul ${time}. Pembuatan PDF mungkin tertunda; Word dan halaman web tetap dibuat. Admin sudah dapat melihat masalah ini di halaman Sistem.`}
          </p>
          <p className="text-[12px] text-[var(--text-2)]">Diperiksa {formatDateTime(data.readiness.checkedAt)}</p>
        </div>
      </div>
    </Panel>
  );
}

export function RenderStatusPanel() {
  const { isAdmin, loading: viewerLoading } = useViewer();
  const [filter, setFilter] = useState<JobFilter>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const env = useRenderEnv({ statuses: FILTER_STATUSES[filter], autoRefresh, includeJobs: isAdmin, enabled: !viewerLoading });
  const { data, error } = env;
  const canRecheck = isAdmin && !!data?.viewer.canRefresh;

  const onRecheck = async () => {
    if (env.rechecking) return;
    setNotice(null);
    setNotice(await env.recheck());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">Sistem</h1>
          <p className="mt-1 text-[12.5px] text-[var(--text-2)]">
            {isAdmin
              ? "Kesiapan mesin cetak Word/PDF, huruf terpasang, antrean, dan pembuatan berkas terbaru."
              : "Status mesin yang membuat berkas Word dan PDF."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-[var(--text-2)]">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="h-3.5 w-3.5" />
              Perbarui otomatis ({POLL_MS / 1000} dtk)
            </label>
            <button
              type="button"
              onClick={env.reload}
              aria-disabled={env.reloading}
              className={`btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium aria-disabled:opacity-50 ${FOCUS}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${env.reloading ? "motion-safe:animate-spin" : ""}`} strokeWidth={2} aria-hidden />
              Muat ulang
            </button>
            {canRecheck && (
              <button
                type="button"
                onClick={() => void onRecheck()}
                aria-disabled={env.rechecking}
                aria-describedby="recheck-desc"
                className={`btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium aria-disabled:opacity-50 ${FOCUS}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {env.rechecking ? "Memeriksa…" : "Periksa ulang kesiapan"}
              </button>
            )}
          </div>
        )}
      </div>
      {canRecheck && (
        <p id="recheck-desc" className="-mt-4 text-[12px] text-[var(--text-2)]">
          Pemeriksaan ulang mengabaikan simpanan 5 menit dan bisa memakan waktu hingga satu menit. Hanya membaca; tidak mengubah huruf atau pengaturan Windows.
        </p>
      )}

      <div aria-live="polite" role="status">
        {notice && <p className={`rounded-md px-3 py-2 text-[12.5px] ${notice.ok ? "text-[var(--text-2)]" : "text-[var(--down)]"}`}>{notice.message}</p>}
      </div>

      {error && (
        <ErrorView
          error={error}
          title={data ? "Status terbaru tidak dapat dimuat" : "Status mesin cetak tidak dapat dimuat"}
          onRetry={env.retry}
          cooldown={env.cooldown}
          actions={data ? <span className="text-[12px] text-[var(--text-2)]">Data di bawah adalah hasil pemuatan terakhir yang berhasil.</span> : undefined}
        />
      )}

      {(viewerLoading || (env.loading && !data && !error)) && <PanelSkeleton compact={!isAdmin} />}

      {data && !isAdmin && <UserStatusCard data={data} />}

      {data && isAdmin && (
        <>
          <ReadinessSection data={data} />
          <JobsSection
            jobs={data.jobs ?? []}
            counts={data.jobCounts}
            jobsError={data.jobsError}
            filter={filter}
            onFilter={setFilter}
            loading={env.reloading && !env.loading}
          />
        </>
      )}
    </div>
  );
}
