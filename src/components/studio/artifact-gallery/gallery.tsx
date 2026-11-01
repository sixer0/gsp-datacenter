"use client";

/*
 * Galeri artefak (S62): filter jenis dan misi dikirim ke R09
 * (`?kind=&mission=&take=`); filter kode chart diterapkan di klien karena R09
 * tidak memfilternya. Filter disimpan di URL (`?tab=galeri&kind=&mission=&code=`).
 * FIX-4b: data lewat `useStudioQuery` + `requestJson` bersama, galat lewat
 * `ErrorView`, detail dalam `Sheet` lebar bersama, label kamus UX-01 §1.2;
 * skema dan id artefak hanya di Info teknis (ADMIN).
 */

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Maximize2, Search, Shapes, X } from "lucide-react";
import { STUDIO_ARTIFACT_KINDS, type StudioArtifactKind } from "@/lib/studio/contract/enums";
import type { ChartDef } from "@/lib/studio/contract/types/params";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { RELEASE_LABEL, RELEASE_TONE, formatDateTime, missionLabel, rawIdTitle } from "@/components/studio/shared/labels";
import { MissionName } from "@/components/studio/shared/raw-id";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import {
  artifactsUrl,
  chartCodeOf,
  getJson,
  outputsOf,
  withQuery,
  type ArtifactListItem,
  type ArtifactListResponse,
} from "./api";
import { GROUP_LABEL, GROUP_ORDER, KIND_LABEL } from "./labels";
import { ArtifactPreview, FileList } from "./preview";

const TAKE = 60;

export const inputCls =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:border-[var(--line-strong)]";

interface Filters {
  kind: StudioArtifactKind | "";
  mission: string;
  code: string;
}

function readFilters(sp: URLSearchParams): Filters {
  const kind = sp.get("kind") ?? "";
  return {
    kind: (STUDIO_ARTIFACT_KINDS as readonly string[]).includes(kind) ? (kind as StudioArtifactKind) : "",
    mission: sp.get("mission") ?? "",
    code: sp.get("code") ?? "",
  };
}

function FilterForm({
  initial,
  charts,
  onApply,
}: {
  initial: Filters;
  charts: readonly ChartDef[] | null;
  onApply: (f: Filters) => void;
}) {
  const [draft, setDraft] = useState<Filters>(initial);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const empty: Filters = { kind: "", mission: "", code: "" };
  const active = Object.values(initial).some(Boolean);
  const codeEnabled = draft.kind === "" || draft.kind === "CHART";
  const drawn = charts?.filter((c) => c.drawn) ?? [];

  return (
    <form
      role="search"
      aria-label="Filter artefak"
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ ...draft, mission: draft.mission.trim(), code: codeEnabled ? draft.code : "" });
      }}
      className="panel grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label htmlFor="art-kind" className="eyebrow mb-1 block">
          Jenis
        </label>
        <select id="art-kind" className={inputCls} value={draft.kind} onChange={(e) => set("kind", e.target.value as Filters["kind"])}>
          <option value="">Semua jenis</option>
          {STUDIO_ARTIFACT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="art-mission" className="eyebrow mb-1 block">
          Folder misi
        </label>
        <input
          id="art-mission"
          className={inputCls}
          value={draft.mission}
          onChange={(e) => set("mission", e.target.value)}
          placeholder="mis. 2026-10-22_nama-misi…"
          autoComplete="off"
        />
      </div>
      <div className="lg:col-span-2">
        <label htmlFor="art-code" className="eyebrow mb-1 block">
          Kode grafik
        </label>
        <select
          id="art-code"
          className={inputCls}
          value={codeEnabled ? draft.code : ""}
          disabled={!codeEnabled}
          aria-describedby="art-code-hint"
          onChange={(e) => set("code", e.target.value)}
        >
          <option value="">Semua kode</option>
          {GROUP_ORDER.map((g) => {
            const items = drawn.filter((c) => c.group === g);
            if (items.length === 0) return null;
            return (
              <optgroup key={g} label={`${g} · ${GROUP_LABEL[g]}`}>
                {items.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <p id="art-code-hint" className="mt-1 text-[11.5px] text-[var(--text-3)]">
          {codeEnabled ? "Berlaku untuk artefak grafik." : "Hanya untuk jenis Grafik."}
        </p>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit" variant="primary" size="sm">
          <Search className="h-3.5 w-3.5" aria-hidden /> Terapkan filter
        </Button>
        {active && (
          <Button
            size="sm"
            onClick={() => {
              setDraft(empty);
              onApply(empty);
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Hapus filter
          </Button>
        )}
      </div>
    </form>
  );
}

function releaseOf(status: string): { text: string; tone: (typeof RELEASE_TONE)[keyof typeof RELEASE_TONE] } {
  const k = status as keyof typeof RELEASE_LABEL;
  return { text: RELEASE_LABEL[k] ?? "Belum diperiksa", tone: RELEASE_TONE[k] ?? "neutral" };
}

function DetailSheet({ item, onClose }: { item: ArtifactListItem | null; onClose: () => void }) {
  const files = item ? outputsOf(item) : [];
  const code = item ? chartCodeOf(item) : null;
  const eyebrow = item ? `${KIND_LABEL[item.kind]}${code ? ` · ${code}` : ""}${item.label ? ` · ${item.label}` : ""}` : "";
  return (
    <Sheet open={item !== null} title={item?.title ?? "Artefak"} description={eyebrow} onClose={onClose} placement="wide">
      {item && (
        <div className="space-y-4">
          <ArtifactPreview files={files} title={item.title} size="large" />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-[var(--text-2)]">Pemeriksaan</dt>
              <dd>{releaseOf(item.releaseStatus).text}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[var(--text-2)]">Misi</dt>
              <dd className="break-words" title={rawIdTitle(item.missionFolder)}>
                {missionLabel(item.missionFolder)}
              </dd>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-[var(--text-2)]">Dibuat</dt>
              <dd>
                {formatDateTime(item.createdAt)} oleh {item.createdBy}
              </dd>
            </div>
          </dl>
          <FileList files={files} title={item.title} />
          <InfoTeknis items={{ Skema: item.schemaId, Id: item.id, Folder: item.missionFolder }} />
        </div>
      )}
    </Sheet>
  );
}

function ArtifactCard({ item, onOpen }: { item: ArtifactListItem; onOpen: () => void }) {
  const files = outputsOf(item);
  const code = chartCodeOf(item);
  return (
    <Panel className="flex flex-col gap-3 p-3">
      <button
        type="button"
        onClick={onOpen}
        className="group relative block w-full rounded-[10px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        aria-label={`Buka detail ${item.title}`}
      >
        <ArtifactPreview files={files} title={item.title} />
        <span className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        </span>
      </button>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="accent">{KIND_LABEL[item.kind]}</Pill>
          {code && <Pill>{code}</Pill>}
          <Pill tone={releaseOf(item.releaseStatus).tone}>{releaseOf(item.releaseStatus).text}</Pill>
        </div>
        <h3 className="line-clamp-2 text-[13.5px] font-medium text-[var(--text)]" title={item.title}>
          {item.title}
        </h3>
        <p className="truncate text-[11.5px] text-[var(--text-3)]">
          {item.label ? `${item.label} · ` : ""}
          <MissionName folder={item.missionFolder} /> · {formatDateTime(item.createdAt)}
        </p>
      </div>
      <div className="mt-auto">
        <FileList files={files} title={item.title} />
      </div>
    </Panel>
  );
}

export function ArtifactGallery({ charts }: { charts: readonly ChartDef[] | null }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/studio/artifacts";
  const sp = useSearchParams();
  const spKey = sp?.toString() ?? "";
  const filters = readFilters(new URLSearchParams(spKey));
  const baseUrl = artifactsUrl({ kind: filters.kind, mission: filters.mission, take: TAKE });
  const q = useStudioQuery<ArtifactListResponse>(baseUrl, (signal) => getJson(baseUrl, "list", signal), {
    source: "artifact-gallery.list",
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [extra, setExtra] = useState<{ base: string; items: ArtifactListItem[]; nextCursor: string | null } | null>(null);
  const [more, setMore] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  const extraValid = extra && extra.base === baseUrl ? extra : null;
  const all = q.data ? [...q.data.artifacts, ...(extraValid?.items ?? [])] : null;
  const nextCursor = extraValid ? extraValid.nextCursor : (q.data?.nextCursor ?? null);
  const visible = all?.filter((a) => !filters.code || chartCodeOf(a) === filters.code) ?? null;
  const codeUnknown = Boolean(filters.code) && (all ?? []).some((a) => a.kind === "CHART" && chartCodeOf(a) === null);
  const open = visible?.find((a) => a.id === openId) ?? null;

  const loadMore = async () => {
    if (!nextCursor || more.loading) return;
    setMore({ loading: true, error: null });
    try {
      const page = await getJson<ArtifactListResponse>(withQuery(baseUrl, { cursor: nextCursor }), "list-more");
      setExtra((prev) => ({
        base: baseUrl,
        items: [...(prev && prev.base === baseUrl ? prev.items : []), ...page.artifacts],
        nextCursor: page.nextCursor ?? null,
      }));
      setMore({ loading: false, error: null });
    } catch (err) {
      // Galat API sudah dicatat client-log oleh requestJson bersama.
      setMore({ loading: false, error: errorMessages(err).body });
    }
  };

  const apply = (f: Filters) => {
    const qs = withQuery("", { tab: "galeri", kind: f.kind, mission: f.mission, code: f.code });
    router.replace(`${pathname}${qs}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <FilterForm key={spKey} initial={filters} charts={charts} onApply={apply} />

      {q.error && <ErrorView error={q.error} title="Daftar artefak tidak dapat dimuat" onRetry={() => q.retry()} cooldown={q.cooldown} />}

      {q.isLoading && !visible && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Memuat artefak">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-[16px]" />
          ))}
        </div>
      )}

      {visible && (
        <>
          <p className="text-[12px] text-[var(--text-3)]" aria-live="polite">
            {visible.length} artefak ditampilkan{nextCursor ? "; masih ada artefak lebih lama" : ""}.
            {codeUnknown && " Sebagian artefak grafik tidak membawa kode di daftar sehingga tidak dapat disaring per kode."}
          </p>
          {visible.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<Shapes className="h-6 w-6" aria-hidden />}
                title="Belum ada artefak"
                hint="Ubah filter, atau buat artefak baru dari templat di tab Buat artefak."
              />
            </Panel>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((a) => (
                <li key={a.id} className="flex">
                  <div className="w-full">
                    <ArtifactCard item={a} onOpen={() => setOpenId(a.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {nextCursor && (
            <div className="flex flex-col items-center gap-2">
              <Button size="sm" onClick={() => void loadMore()} ariaDisabled={more.loading}>
                {more.loading ? "Memuat…" : "Muat artefak lebih lama"}
              </Button>
              {more.error && (
                <p role="alert" className="text-[12px] text-[var(--warn)]">
                  {more.error}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <DetailSheet item={open} onClose={() => setOpenId(null)} />
    </div>
  );
}
