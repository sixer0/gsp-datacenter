"use client";

/*
 * Tab Riwayat dokumen (SR-30; UX-01 W8, §3c). Sumber R07 GET (terbaru dulu).
 * Per versi: nomor, waktu, oleh, lingkup awam (dari nomor yang berubah),
 * Apa/Mengapa/Dampak. Tindakan: Lihat versi ini (tab Baca + pita versi lama),
 * Bandingkan dengan terbaru (R07 `?from&to` + `revision/diff-view.tsx`,
 * dipakai ulang baca saja), Buat berkas dari versi ini (R07 POST; berkas
 * lengkap hanya bila versi itu Lengkap -> 409 dijelaskan awam).
 */
import { useEffect, useRef, useState } from "react";
import { GitCompare, Eye, FileOutput } from "lucide-react";
import type { RevisionSummary } from "@/lib/studio/contract/types/api";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { isStudioApiError } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { RELEASE_LABEL, RELEASE_TONE, actorLabel, changeImpactLabel, changeWhatLabel, formatDateTime, versionLabel } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { DiffView } from "@/components/studio/revision/diff-view";
import { diffWithLatest, listRevisions, renderRevision } from "./doc-api";
import { changedLabel, incompleteReportOf, missingLabel, scopeResolvers } from "./doc-model";
import { useDocPage } from "./doc-context";

const PAGE = 20;

function CompareSheet({ id, from, to, onClose }: { id: string; from: number; to: number; onClose: () => void }) {
  const q = useStudioQuery(`doc-diff:${id}:${from}:${to}`, (signal) => diffWithLatest(id, from, to, signal), { source: "documents.history-compare" });
  return (
    <Sheet open title={`Bandingkan ${versionLabel(from).toLowerCase()} dengan terbaru`} description={`Perubahan dari ${versionLabel(from).toLowerCase()} ke ${versionLabel(to).toLowerCase()}.`} onClose={onClose} placement="side">
      {q.isLoading && <Skeleton className="h-24 w-full" />}
      {q.error && !q.data && <ErrorView variant="inline" error={q.error} onRetry={q.retry} cooldown={q.cooldown} title="Perbandingan tidak dapat dimuat" />}
      {q.data && <DiffView docId={id} diff={q.data.diff} />}
    </Sheet>
  );
}

function RevisionRow({ r, latest, onCompare }: { r: RevisionSummary; latest: number | null; onCompare: (n: number) => void }) {
  const { id, navigate, slotLabels, refreshAll } = useDocPage();
  const { notify } = useNotice();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLatest = latest === r.revisionNo;
  // A2: kode lingkup/pelaku mentah (kiriman agen otomatis) diterjemahkan; mentahnya di Info teknis.
  const resolvers = scopeResolvers(slotLabels);

  async function makeFile() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await renderRevision(id, r.revisionNo, ["PDF", "DOCX"]);
      notify({
        message: res.job.status === "FAILED" ? `Berkas ${versionLabel(r.revisionNo).toLowerCase()} gagal dibuat` : `Berkas ${versionLabel(r.revisionNo).toLowerCase()} siap`,
        tone: res.job.status === "FAILED" ? "warn" : "success",
        action: { label: "Lihat berkas", onClick: () => navigate({ tab: "berkas" }) },
      });
      refreshAll();
    } catch (e) {
      const rep = isStudioApiError(e) && e.code === "DOCUMENT_INCOMPLETE" ? incompleteReportOf(e.details) : null;
      const m = errorMessages(e, rep ? { missing: rep.missingRequired.map((x) => missingLabel(x, rep)) } : undefined);
      setError(
        isStudioApiError(e) && e.code === "DOCUMENT_INCOMPLETE"
          ? `Versi ini belum lengkap, jadi berkas lengkapnya tidak dapat dibuat. ${m.body}`
          : `${m.title}. ${m.body}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-2 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[13.5px] font-medium text-[var(--text)]">{versionLabel(r.revisionNo)}</span>
        {isLatest && <Pill tone="accent">Terbaru</Pill>}
        <span className="text-[12.5px] text-[var(--text-2)]">{formatDateTime(r.createdAt)}</span>
        <span className="text-[12.5px] text-[var(--text-2)]">{actorLabel(r.createdBy)}</span>
        <span className="text-[12.5px] text-[var(--text)]">{changedLabel(r.changedAddresses, slotLabels)}</span>
        <Pill tone={RELEASE_TONE[r.releaseStatus]}>{RELEASE_LABEL[r.releaseStatus]}</Pill>
      </div>
      <dl className="grid gap-x-4 gap-y-0.5 text-[12.5px] sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="text-[var(--text-2)]">Apa yang diubah</dt>
        <dd className="text-[var(--text)]">{changeWhatLabel(r.changeWhat, resolvers)}</dd>
        <dt className="text-[var(--text-2)]">Mengapa</dt>
        <dd className="text-[var(--text)]">{r.changeWhy || "-"}</dd>
        <dt className="text-[var(--text-2)]">Dampaknya</dt>
        <dd className="text-[var(--text)]">{changeImpactLabel(r.changeImpact, resolvers)}</dd>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        {!isLatest && (
          <Button size="sm" onClick={() => navigate({ tab: "baca", versi: r.revisionNo, p: null, target: null })} className="whitespace-nowrap">
            <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Lihat versi ini
          </Button>
        )}
        {!isLatest && latest !== null && (
          <Button size="sm" onClick={() => onCompare(r.revisionNo)} className="whitespace-nowrap">
            <GitCompare className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Bandingkan dengan terbaru
          </Button>
        )}
        <Button size="sm" onClick={() => void makeFile()} ariaDisabled={busy} className="whitespace-nowrap">
          <FileOutput className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {busy ? "Berkas sedang dibuat…" : "Buat berkas dari versi ini"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-[12.5px] text-[var(--down)]">
          {error}
        </p>
      )}
      <InfoTeknis
        items={{
          "Revisi induk": r.parentRevisionNo,
          "Nomor berubah": r.changedAddresses.join(", "),
          Pelaku: r.createdBy,
          "Dampak (mentah)": r.changeImpact !== changeImpactLabel(r.changeImpact, resolvers) ? r.changeImpact : null,
          "Sidik isi": r.snapshotSha256,
        }}
      />
    </li>
  );
}

export function HistoryTab() {
  const { id, latestRevisionNo, refreshTick } = useDocPage();
  const q = useStudioQuery(`doc-history:${id}`, (signal) => listRevisions(id, signal), { source: "documents.history" });
  const [shown, setShown] = useState(PAGE);
  const [compare, setCompare] = useState<number | null>(null);
  const { refetch } = q;
  const firstTick = useRef(refreshTick);
  useEffect(() => {
    if (refreshTick !== firstTick.current) refetch();
  }, [refreshTick, refetch]);

  if (q.isLoading) {
    return (
      <Panel className="p-5">
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Panel>
    );
  }
  if (q.error && !q.data) return <ErrorView error={q.error} title="Riwayat dokumen tidak dapat dimuat" onRetry={q.retry} cooldown={q.cooldown} />;
  const revisions = q.data?.revisions ?? [];
  if (revisions.length === 0) {
    return (
      <Panel className="p-5">
        <EmptyState title="Belum ada riwayat" hint="Riwayat muncul setiap kali agen mengirim isi atau seseorang menyunting dokumen." />
      </Panel>
    );
  }
  const latest = latestRevisionNo ?? revisions[0]?.revisionNo ?? null;
  return (
    <div className="space-y-3">
      <Panel className="p-0">
        <ol className="divide-y divide-[var(--line)]">
          {revisions.slice(0, shown).map((r) => (
            <RevisionRow key={r.revisionNo} r={r} latest={latest} onCompare={setCompare} />
          ))}
        </ol>
      </Panel>
      {revisions.length > shown && (
        <div className="flex justify-center">
          <Button onClick={() => setShown((n) => n + PAGE)} className="whitespace-nowrap">
            Muat versi lebih lama
          </Button>
        </div>
      )}
      {compare !== null && latest !== null && <CompareSheet id={id} from={compare} to={latest} onClose={() => setCompare(null)} />}
    </div>
  );
}
