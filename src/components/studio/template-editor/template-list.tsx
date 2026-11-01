"use client";

/**
 * Daftar templat `/studio/templates` (SR-29; UX-01 W2): tab Templat dan Gaya
 * (ADMIN), pencarian, dialog "Buat templat" (pilih gaya), dan menu tindakan
 * admin (impor profil templat, R01 POST `?import=profile`). Satu tindakan
 * utama per layar: "Buat templat".
 *
 * Kolom "dipakai N dokumen" dan "n bagian · A4 tegak" W2 tidak ditampilkan:
 * R01 tidak menyediakan agregatnya (UX-01 §8 T-5 opsional).
 */
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FilePlus2, LayoutTemplate, MoreHorizontal, Search, Upload } from "lucide-react";
import { STUDIO_MAX_JSON_BYTES } from "@/lib/studio/contract/env";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { issuesOf } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { formatDate, templateDescription } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { useViewer } from "@/components/studio/shared/use-viewer";
import { importProfile, listPresets, listTemplates, type PresetItem, type TemplateListItem } from "./api";
import { CreateTemplateDialog } from "./create-template-dialog";
import { creatorLabel, isOwner } from "./model";
import { ActorName } from "@/components/studio/shared/raw-id";

type Tab = "templat" | "gaya";

async function loadList(signal: AbortSignal): Promise<{ templates: TemplateListItem[]; presets: PresetItem[] }> {
  const [t, p] = await Promise.all([listTemplates(signal), listPresets(signal)]);
  return { templates: Array.isArray(t.templates) ? t.templates : [], presets: Array.isArray(p.items) ? p.items : [] };
}

export function TemplateList() {
  const { viewer, isAdmin } = useViewer();
  const q = useStudioQuery("template-editor:list", loadList, { source: "template-editor.list" });
  const [tab, setTab] = useState<Tab>("templat");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const searchId = useId();

  const rows = useMemo(() => {
    const all = q.data?.templates ?? [];
    const byTab = all.filter((t) => (tab === "gaya" ? t.isPreset === true : t.isPreset !== true));
    const needle = query.trim().toLowerCase();
    return needle ? byTab.filter((t) => t.name.toLowerCase().includes(needle) || (t.description ?? "").toLowerCase().includes(needle)) : byTab;
  }, [q.data, tab, query]);
  const activeTab: Tab = isAdmin ? tab : "templat";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">Templat</h1>
          <p className="mt-1 text-[13px] text-[var(--text-2)]">Templat menentukan gaya dan susunan dokumen. Agen hanya mengisi kontennya.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setCreateOpen(true)} ariaDisabled={!q.data} className="whitespace-nowrap">
            <FilePlus2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            Buat templat
          </Button>
          {isAdmin && <AdminMenu onImport={() => setImportOpen(true)} />}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <div role="tablist" aria-label="Jenis daftar" className="flex gap-1">
            {(["templat", "gaya"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={activeTab === t}
                onClick={() => setTab(t)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") setTab(t === "templat" ? "gaya" : "templat");
                }}
                className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  activeTab === t ? "border-[var(--accent)] text-[var(--text)]" : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--line-strong)]"
                }`}
              >
                {t === "templat" ? "Templat" : "Gaya"}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <label htmlFor={searchId} className="relative block w-full sm:w-64">
          <span className="sr-only">Cari templat</span>
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-2)]" strokeWidth={2} aria-hidden />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari"
            className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] py-2 pl-8 pr-3 text-[13px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          />
        </label>
      </div>

      {q.error && !q.data ? (
        <ErrorView error={q.error} title="Daftar templat tidak dapat dimuat" onRetry={() => q.retry()} cooldown={q.cooldown} />
      ) : !q.data ? (
        <Panel>
          <div aria-busy="true" aria-label="Memuat templat">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2 px-4 py-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          {query.trim() ? (
            <EmptyState title="Tidak ada templat yang cocok dengan pencarian." action={<Button onClick={() => setQuery("")}>Hapus pencarian</Button>} />
          ) : activeTab === "gaya" ? (
            <EmptyState icon={<LayoutTemplate className="h-6 w-6" strokeWidth={2} aria-hidden />} title="Belum ada gaya." hint="Gaya disiapkan admin, mis. lewat impor profil templat." />
          ) : (
            <EmptyState
              icon={<LayoutTemplate className="h-6 w-6" strokeWidth={2} aria-hidden />}
              title="Belum ada templat."
              hint="Buat templat dengan memilih satu gaya; pengaturan dan susunan dokumen bisa diubah sesudahnya."
              action={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Buat templat
                </Button>
              }
            />
          )}
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-[var(--line)]">
            {rows.map((t) => (
              <TemplateRow key={t.id} t={t} isAdmin={isAdmin} username={viewer?.username ?? null} />
            ))}
          </ul>
        </Panel>
      )}
      {q.isRefreshing && (
        <p aria-live="polite" className="text-[12px] text-[var(--text-2)]">
          Memperbarui…
        </p>
      )}

      {createOpen && q.data && <CreateTemplateDialog open onClose={() => setCreateOpen(false)} presets={q.data.presets} isAdmin={isAdmin} />}
      {isAdmin && importOpen && <ImportSheet onClose={() => setImportOpen(false)} onImported={() => q.refetch()} />}
    </div>
  );
}

function TemplateRow({ t, isAdmin, username }: { t: TemplateListItem; isAdmin: boolean; username: string | null }) {
  const href = `/studio/templates/${encodeURIComponent(t.id)}`;
  const mine = isOwner(t.createdBy, username);
  return (
    <li className="group relative flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--surface-2)]">
      <div className="min-w-0">
        <Link
          href={href}
          className="rounded-[4px] text-[14px] font-medium text-[var(--text)] after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {t.name}
        </Link>
        <p className="mt-0.5 text-[12.5px] text-[var(--text-2)]">
          Versi {t.latestVersionNo.toLocaleString("id-ID")} · {formatDate(t.updatedAt)}
        </p>
        {/* UI-02 (UA-M07): deskripsi awam, maks 2 baris; deskripsi asli di tooltip. */}
        {templateDescription(t.slug, t.description) && (
          <p className="mt-0.5 line-clamp-2 max-w-[48rem] text-[12.5px] text-[var(--text-2)]" title={t.description ?? undefined}>
            {templateDescription(t.slug, t.description)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {t.isCanonical && <Pill tone="accent">Kanonik</Pill>}
        {isAdmin && t.restricted && <Pill tone="warn">Terbatas</Pill>}
        {mine ? <Pill>Milik Anda</Pill> : <span className="text-[12px] text-[var(--text-2)]">oleh <ActorName by={t.createdBy} text={creatorLabel(t.createdBy)} /></span>}
        <span className="inline-flex items-center gap-1 pl-2 text-[12.5px] text-[var(--accent)]" aria-hidden>
          Buka
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
    </li>
  );
}

function AdminMenu({ onImport }: { onImport: () => void }) {
  return (
    <details className="relative">
      <summary
        aria-label="Tindakan admin"
        className="btn-ghost inline-flex cursor-pointer list-none items-center px-2.5 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-56 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-1)] p-1 shadow-xl">
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
            onImport();
          }}
          className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[13px] text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
          Impor profil templat
        </button>
      </div>
    </details>
  );
}

// ── Impor profil (ADMIN) ────────────────────────────────────────────────

function ImportSheet({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const router = useRouter();
  const { notify } = useNotice();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ pointer: string; message: string }>>([]);
  const fileId = useId();
  const textId = useId();
  const statusId = useId();

  const parsed = useMemo((): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } | null => {
    if (!text.trim()) return null;
    try {
      const v = JSON.parse(text) as unknown;
      if (!v || typeof v !== "object" || Array.isArray(v)) return { ok: false, message: "Profil harus berupa objek." };
      return { ok: true, value: v as Record<string, unknown> };
    } catch (e) {
      return { ok: false, message: `Isi berkas tidak dapat dibaca: ${e instanceof Error ? e.message : String(e)}` };
    }
  }, [text]);
  const meta = parsed?.ok && parsed.value.meta && typeof parsed.value.meta === "object" ? (parsed.value.meta as Record<string, unknown>) : null;

  const onFile = useCallback(async (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (f.size > STUDIO_MAX_JSON_BYTES) {
      setError(`Berkas terlalu besar (${(f.size / 1048576).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB; maks ${(STUDIO_MAX_JSON_BYTES / 1048576).toFixed(0)} MB).`);
      return;
    }
    try {
      setText(await f.text());
    } catch {
      setError("Berkas tidak dapat dibaca.");
    }
  }, []);

  const submit = async () => {
    if (!parsed?.ok || !meta || busy) return;
    setBusy(true);
    setError(null);
    setIssues([]);
    try {
      const res = await importProfile(parsed.value);
      notify({ message: "Profil templat diimpor", tone: "success" });
      onImported();
      onClose();
      router.push(`/studio/templates/${encodeURIComponent(res.template.id)}`);
    } catch (e) {
      setIssues(issuesOf(e).map((i) => ({ pointer: i.path ?? "", message: i.message })));
      setError(errorMessages(e, { subject: "Templat" }).body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Impor profil templat"
      description="Profil templat lengkap dari berkas ekspor templat. Khusus admin."
      dismissible={!busy}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} ariaDisabled={busy}>
            Batal
          </Button>
          <Button variant="primary" onClick={() => void submit()} ariaDisabled={busy || !parsed?.ok || !meta}>
            {busy ? "Mengimpor…" : "Impor"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor={fileId} className="mb-1 block text-[12.5px] text-[var(--text-2)]">
            Berkas profil
          </label>
          <input id={fileId} type="file" accept=".json,application/json" onChange={(e) => void onFile(e.target.files?.[0])} className="block text-[12.5px] text-[var(--text-2)]" />
        </div>
        <div>
          <label htmlFor={textId} className="mb-1 block text-[12.5px] text-[var(--text-2)]">
            atau tempel isinya
          </label>
          <textarea
            id={textId}
            value={text}
            spellCheck={false}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={parsed?.ok === false ? true : undefined}
            aria-describedby={statusId}
            className="min-h-[10rem] w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 font-mono text-[12px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          />
          <p id={statusId} aria-live="polite" className="mt-1 text-[12px]">
            {parsed === null ? null : parsed.ok ? (
              <span className="text-[var(--text-2)]">{meta ? `Profil "${String(meta.name ?? meta.slug ?? "?")}" siap diimpor.` : "Bagian meta (slug, nama, jenis) tidak ditemukan."}</span>
            ) : (
              <span className="text-[var(--down)]">{parsed.message}</span>
            )}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}
        {issues.length > 0 && (
          <InfoTeknis summary="Rincian penolakan">
            <ul className="max-h-48 space-y-1 overflow-auto">
              {issues.map((i, n) => (
                <li key={n}>
                  <span className="font-mono text-[var(--text)]">{i.pointer || "/"}</span> <span className="text-[var(--text-2)]">{i.message}</span>
                </li>
              ))}
            </ul>
          </InfoTeknis>
        )}
      </div>
    </Sheet>
  );
}
