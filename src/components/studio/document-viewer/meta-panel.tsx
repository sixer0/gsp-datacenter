"use client";

/*
 * Kepala halaman dokumen (SR-30; UX-01 W6): remah roti, judul, nomor dokumen,
 * tingkat terbitan, templat yang dipatok, Rel kelengkapan (ukuran `md`, segmen
 * membawa ke bagian di tab Baca), kartu Buat berkas, dan menu "Tindakan admin"
 * (K-8 ganti versi templat, K-9 nomori ulang bab; hanya ADMIN, penegakan di
 * server). Sama untuk keempat tab.
 */
import { useId, useState } from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import type { CompletenessReportV2 } from "@/lib/studio/contract";
import { Pill, Skeleton } from "@/components/ui/kit";
import { CompletenessRail } from "@/components/studio/shared/completeness-rail";
import { ConfirmDialog } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { COMPLETENESS_STATUS_LABEL, RELEASE_LABEL, RELEASE_TONE, TIER_HINT, TIER_LABEL, missionLabel, rawIdTitle, versionLabel } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { STUDIO_NAV } from "@/lib/studio/contract/ui";
import { patchStructure } from "./doc-api";
import { chapterSlotOf } from "./doc-model";
import { useDocPage } from "./doc-context";
import { RenderCard } from "./render-card";

const DOCS_HREF = STUDIO_NAV.find((n) => n.href.endsWith("/documents"))?.href ?? "/studio/documents";

const FIELD =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function renumberMap(report: CompletenessReportV2 | null): Record<string, string> {
  if (!report) return {};
  const host = chapterSlotOf(report);
  const keys = (host ? report.chapters?.[host]?.present ?? [] : []).map((p) => p.key).filter((k) => /^\d+$/.test(k));
  keys.sort((a, b) => Number(a) - Number(b));
  const map: Record<string, string> = {};
  keys.forEach((k, i) => {
    if (k !== String(i + 1)) map[k] = String(i + 1);
  });
  return map;
}

function AdminMenu() {
  const { id, latestRevisionNo, report, structure, refreshAll } = useDocPage();
  const { notify } = useNotice();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "version" | "renumber">(null);
  const [versionNo, setVersionNo] = useState("");
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const current = structure.data?.templateVersion?.versionNo ?? null;
  const map = renumberMap(report);
  const pairs = Object.entries(map);

  const close = () => {
    setDialog(null);
    setError(null);
    setWhy("");
    setVersionNo("");
  };

  async function confirm() {
    if (latestRevisionNo === null) return;
    if (!why.trim()) {
      setError("Isi alasan perubahan lebih dulu.");
      throw new Error("why");
    }
    try {
      if (dialog === "version") {
        const n = Number(versionNo);
        if (!Number.isInteger(n) || n < 1) {
          setError("Isi nomor versi templat berupa angka bulat.");
          throw new Error("version");
        }
        const r = await patchStructure(id, {
          op: "templateVersion",
          versionNo: n,
          baseRevisionNo: latestRevisionNo,
          change: { what: `Pindahkan dokumen ke templat versi ${n}`, why: why.trim(), impact: "Tampilan berkas berikutnya; isi tidak berubah" },
        });
        notify({ message: `Dokumen dipindah ke templat versi ${n}. Disimpan sebagai versi ${r.revision.revisionNo}` });
      } else {
        const r = await patchStructure(id, {
          op: "renumberChapters",
          map,
          baseRevisionNo: latestRevisionNo,
          change: { what: "Nomori ulang bab berurutan", why: why.trim(), impact: "Nomor bab; rujukan di teks tidak ikut diubah" },
        });
        notify({ message: `Bab dinomori ulang. Disimpan sebagai versi ${r.revision.revisionNo}` });
      }
      close();
      refreshAll();
    } catch (e) {
      if (e instanceof Error && (e.message === "why" || e.message === "version")) throw e;
      const m = errorMessages(e);
      setError(`${m.title}. ${m.body}`);
      throw e;
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
        Tindakan admin
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="absolute right-0 z-30 mt-1 w-56 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-2)] p-1 shadow-xl"
        >
          <li role="none">
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                setDialog("version");
              }}
              className="w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-[var(--text)] hover:bg-[var(--surface-1)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              Ganti versi templat…
            </button>
          </li>
          <li role="none">
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                setDialog("renumber");
              }}
              className="w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-[var(--text)] hover:bg-[var(--surface-1)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              Nomori ulang bab…
            </button>
          </li>
        </ul>
      )}

      <ConfirmDialog
        open={dialog === "version"}
        title="Ganti versi templat"
        description={`Pindahkan dokumen ke versi templat lain? Tampilan berkas berikutnya bisa berubah. Isi tidak berubah. Versi dokumen baru akan dibuat.${current ? ` Sekarang: versi ${current}.` : ""}`}
        confirmLabel={versionNo ? `Pindahkan ke versi ${versionNo}` : "Pindahkan"}
        tone="default"
        onConfirm={confirm}
        onCancel={close}
        error={error}
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-[12.5px] text-[var(--text-2)]">
            Nomor versi templat
            <input inputMode="numeric" value={versionNo} onChange={(e) => setVersionNo(e.target.value.replace(/[^\d]/g, ""))} className={FIELD} />
          </label>
          <label className="block space-y-1 text-[12.5px] text-[var(--text-2)]">
            Mengapa
            <input value={why} onChange={(e) => setWhy(e.target.value)} className={FIELD} />
          </label>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "renumber"}
        title="Nomori ulang bab"
        description={
          pairs.length
            ? `Nomori ulang bab menjadi berurutan (${pairs.map(([a, b]) => `${a} menjadi ${b}`).join(", ")})? Rujukan nomor bab di dalam teks tidak ikut diubah.`
            : "Nomor bab sudah berurutan. Tidak ada yang perlu diubah."
        }
        confirmLabel="Nomori ulang"
        tone="default"
        confirmDisabled={pairs.length === 0}
        onConfirm={confirm}
        onCancel={close}
        error={error}
      >
        {pairs.length > 0 && (
          <label className="block space-y-1 text-[12.5px] text-[var(--text-2)]">
            Mengapa
            <input value={why} onChange={(e) => setWhy(e.target.value)} className={FIELD} />
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
}

export function DocumentHead() {
  const { detail, structure, report, isAdmin, navigate } = useDocPage();
  const d = detail.data;
  if (!d) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-7 w-80" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  const doc = d.document;
  const tv = structure.data?.templateVersion ?? null;
  const mission = doc.missionFolder ? missionLabel(doc.missionFolder) : null;
  const docsWithMission = doc.missionFolder ? `${DOCS_HREF}?mission=${encodeURIComponent(doc.missionFolder)}` : DOCS_HREF;

  return (
    <header className="space-y-4">
      <nav aria-label="Remah roti" className="flex flex-wrap items-center gap-1 text-[12.5px] text-[var(--text-2)]">
        <Link href={DOCS_HREF} className="rounded hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
          Dokumen
        </Link>
        {mission && (
          <>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <Link
              href={docsWithMission}
              title={rawIdTitle(doc.missionFolder)}
              className="rounded hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {mission}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span aria-current="page" className="max-w-[24rem] truncate text-[var(--text)]">
          {doc.title}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[var(--text)]">{doc.title}</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[var(--text-2)]">
            <span className="num">{doc.docNumber}</span>
            <span aria-hidden>·</span>
            <span title={TIER_HINT[doc.tier]}>{TIER_LABEL[doc.tier]}</span>
            {tv && (
              <>
                <span aria-hidden>·</span>
                <span>
                  Templat versi {tv.versionNo} <span className="text-[var(--text-2)]">(dikunci saat dibuat)</span>
                </span>
              </>
            )}
            {doc.releaseStatus && <Pill tone={RELEASE_TONE[doc.releaseStatus]}>{RELEASE_LABEL[doc.releaseStatus]}</Pill>}
          </p>
        </div>
        {isAdmin && <AdminMenu />}
      </div>

      {report ? (
        <CompletenessRail
          summary={report}
          size="md"
          onSegmentClick={(seg) => navigate({ tab: "baca", target: seg.chapterKey ? `${seg.slotKey}:${seg.chapterKey}` : seg.slotKey })}
        />
      ) : (
        <p className="text-[12.5px] text-[var(--text-2)]">
          {COMPLETENESS_STATUS_LABEL[doc.completeness]} · {versionLabel(doc.currentRevisionNo)}
        </p>
      )}

      <RenderCard />

      <InfoTeknis
        summary="Info teknis dokumen"
        items={{
          "Id dokumen": doc.id,
          "Kunci dokumen misi": doc.docKey,
          "Folder misi": doc.missionFolder,
          "Templat (slug)": tv?.slug,
          "Revisi terbaru": doc.currentRevisionNo,
          Skema: d.revision.schemaId,
          "Lingkup perubahan terakhir": d.revision.changeScope,
        }}
      >
        {report?.forwardToController && (
          <p className="whitespace-pre-wrap font-mono text-[11.5px] text-[var(--text)]">{report.forwardToController}</p>
        )}
      </InfoTeknis>
    </header>
  );
}
