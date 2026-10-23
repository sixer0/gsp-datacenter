"use client";

/*
 * Halaman dokumen `/studio/documents/[id]` (SR-30; UX-01 §2.1, W6-W9).
 *
 * URL = sumber keadaan: `?tab=baca|kelengkapan|berkas|riwayat` (bawaan baca),
 * `&versi=<n>` (versi lama, baca saja), `&p=<pid>` (paragraf terpilih, tidak
 * tampil), `&ke=<bagian>` (tujuan gulir). Kepala sama untuk keempat tab
 * (DocumentHead + kartu Buat berkas); tab memakai pola ARIA tablist dengan
 * panah kiri/kanan. Galat muat kepala memakai `shared/error-view`; 404 =
 * pesan awam + "Kembali ke Dokumen".
 */
import { useCallback, useRef, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/kit";
import { ErrorView } from "@/components/studio/shared/error-view";
import { isStudioApiError } from "@/components/studio/shared/http";
import { RefreshingIndicator } from "@/components/studio/shared/notice";
import { STUDIO_NAV } from "@/lib/studio/contract/ui";
import { CompletenessTab } from "./completeness-tab";
import { DOC_TABS, DocPageProvider, useDocPage, type DocNavigation, type DocTab } from "./doc-context";
import { HistoryTab } from "./history-tab";
import { DocumentHead } from "./meta-panel";
import { FilesTab } from "./output-files";
import { ReaderTab } from "./reader/reader-tab";

const DOCS_HREF = STUDIO_NAV.find((n) => n.href.endsWith("/documents"))?.href ?? "/studio/documents";

function readTab(v: string | null): DocTab {
  return DOC_TABS.some((t) => t.id === v) ? (v as DocTab) : "baca";
}

function readVersi(v: string | null): number | null {
  return v && /^[1-9][0-9]{0,8}$/.test(v) ? Number(v) : null;
}

function readPid(v: string | null): string | null {
  return v && /^[a-z0-9][a-z0-9-]{2,63}$/.test(v) ? v : null;
}

function readTarget(v: string | null): string | null {
  return v && /^[A-Za-z0-9_:-]{1,120}$/.test(v) ? v : null;
}

function Tabs() {
  const { tab, navigate } = useDocPage();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % DOC_TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + DOC_TABS.length) % DOC_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = DOC_TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const t = DOC_TABS[next]!;
    navigate({ tab: t.id });
    refs.current[t.id]?.focus();
  };
  return (
    <div role="tablist" aria-label="Bagian halaman dokumen" className="flex gap-1 overflow-x-auto border-b border-[var(--line)]">
      {DOC_TABS.map((t, i) => {
        const selected = t.id === tab;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => navigate({ tab: t.id })}
            onKeyDown={(e) => onKey(e, i)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
              selected ? "border-[var(--accent)] text-[var(--text)]" : "border-transparent text-[var(--text-2)] hover:text-[var(--text)]"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function PageBody() {
  const { tab, detail, structure } = useDocPage();
  const err = detail.error;
  if (err && !detail.data) {
    const notFound = isStudioApiError(err) && err.status === 404;
    return (
      <ErrorView
        error={err}
        title={notFound ? "Dokumen ini tidak ditemukan" : "Dokumen tidak dapat dimuat"}
        context={{ subject: "Dokumen" }}
        onRetry={notFound ? undefined : detail.retry}
        cooldown={detail.cooldown}
        actions={
          <Button size="sm" href={DOCS_HREF} className="whitespace-nowrap">
            Kembali ke Dokumen
          </Button>
        }
      />
    );
  }
  return (
    <div className="space-y-5">
      <DocumentHead />
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Tabs />
        </div>
        <RefreshingIndicator active={detail.isRefreshing || structure.isRefreshing} />
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={-1} className="outline-none">
        {detail.data && (
          <>
            {tab === "baca" && <ReaderTab />}
            {tab === "kelengkapan" && <CompletenessTab />}
            {tab === "berkas" && <FilesTab />}
            {tab === "riwayat" && <HistoryTab />}
          </>
        )}
      </div>
    </div>
  );
}

export function DocumentViewer({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = readTab(sp.get("tab"));
  const versi = readVersi(sp.get("versi"));
  const p = readPid(sp.get("p"));
  const target = readTarget(sp.get("ke"));

  const navigate = useCallback(
    (n: DocNavigation) => {
      const next = new URLSearchParams(sp.toString());
      const set = (k: string, v: string | null | undefined) => {
        if (v === undefined) return;
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      };
      if (n.tab !== undefined) {
        set("tab", n.tab === "baca" ? null : n.tab);
        if (n.target === undefined && n.tab !== "baca") next.delete("ke");
      }
      if (n.versi !== undefined) set("versi", n.versi === null ? null : String(n.versi));
      if (n.p !== undefined) set("p", n.p);
      if (n.target !== undefined) set("ke", n.target);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, sp],
  );

  return (
    <DocPageProvider id={id} tab={tab} versi={versi} selectedPid={p} target={target} navigate={navigate}>
      <PageBody />
    </DocPageProvider>
  );
}
