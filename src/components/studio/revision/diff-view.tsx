"use client";

/**
 * Tampilan perbandingan dua versi dokumen (keluaran R07 `?from&to`), dipakai
 * ulang tab Riwayat SR-30 ("Bandingkan dengan terbaru"): per paragraf
 * ditambah/dihapus/diubah/bergeser; entri dapat dibuka untuk menyorot
 * perubahan teks (isi diambil dari R06 `?rev=` lewat klien bersama `shared/http`).
 * Bahasa layar mengikuti kamus UX-01 §1.2 (FIX-4b): "nomor", "versi".
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Pill } from "@/components/ui/kit";
import { sectionTypeLabel, versionLabel } from "@/components/studio/shared/labels";
import { fetchBlock, reportClientError, type BlockDiffEntry, type RevisionDiff } from "./api";
import { friendlyError } from "./labels";
import { contentPlain, TextDiff } from "./text-diff";

type Kind = "added" | "removed" | "changed" | "moved";

const GROUPS: Array<{ kind: Kind; title: string; tone: "up" | "down" | "warn" | "neutral" }> = [
  { kind: "changed", title: "Diubah", tone: "warn" },
  { kind: "added", title: "Ditambah", tone: "up" },
  { kind: "removed", title: "Dihapus", tone: "down" },
  { kind: "moved", title: "Bergeser (nomor baru)", tone: "neutral" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function numOld(e: BlockDiffEntry) {
  return e.oldArtifactLabel ?? e.oldAddress;
}
function numNew(e: BlockDiffEntry) {
  return e.newArtifactLabel ?? e.newAddress;
}

function EntryRow({ docId, diff, entry, kind }: { docId: string; diff: RevisionDiff; entry: BlockDiffEntry; kind: Kind }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ loading: boolean; before?: string; after?: string; error?: string }>({ loading: false });
  const oldA = entry.oldAddress;
  const newA = entry.newAddress;
  const canExpand = kind !== "moved";

  async function load() {
    setState({ loading: true });
    try {
      const [b, a] = await Promise.all([
        kind !== "added" && oldA ? fetchBlock(docId, oldA, diff.fromRevisionNo) : Promise.resolve(null),
        kind !== "removed" && newA ? fetchBlock(docId, newA, diff.toRevisionNo) : Promise.resolve(null),
      ]);
      setState({ loading: false, before: b ? contentPlain(b.content) : "", after: a ? contentPlain(a.content) : "" });
    } catch (e) {
      reportClientError("compare.entry", e, { documentId: docId, oldA, newA });
      setState({ loading: false, error: friendlyError(e, "Isi paragraf gagal dimuat.") });
    }
  }

  const label =
    kind === "added" ? newA : kind === "removed" ? oldA : oldA === newA || !newA ? oldA : `${oldA} → ${newA}`;
  const panelId = `diff-${kind}-${entry.blockId}`;

  return (
    <li className="rounded-[var(--r-sm)] border border-[var(--line)]">
      <button
        type="button"
        disabled={!canExpand}
        aria-expanded={canExpand ? open : undefined}
        aria-controls={canExpand ? panelId : undefined}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && state.before === undefined && !state.loading) void load();
        }}
        className={`flex w-full items-center gap-2 rounded-[var(--r-sm)] px-3 py-2 text-left disabled:cursor-default ${FOCUS}`}
      >
        {canExpand ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-2)]" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-2)]" strokeWidth={2} aria-hidden />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <span className="num text-[13px] text-[var(--text)]">{label ?? "Tanpa nomor"}</span>
        <span className="text-[11.5px] text-[var(--text-2)]">{sectionTypeLabel(entry.type)}</span>
        {kind === "moved" && numOld(entry) !== numNew(entry) && (
          <span className="num text-[11.5px] text-[var(--text-2)]">
            {numOld(entry)} → {numNew(entry)}
          </span>
        )}
      </button>
      {canExpand && open && (
        <div id={panelId} className="border-t border-[var(--line)] px-3 py-2">
          {state.loading && (
            <p role="status" className="flex items-center gap-2 text-[12px] text-[var(--text-2)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden /> Memuat isi…
            </p>
          )}
          {state.error && (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--down)]">
              {state.error}
              <button type="button" className={`btn-ghost px-2 py-0.5 text-[11.5px] ${FOCUS}`} onClick={() => void load()}>
                Muat ulang
              </button>
            </div>
          )}
          {!state.loading && !state.error && state.before !== undefined && <TextDiff before={state.before ?? ""} after={state.after ?? ""} />}
        </div>
      )}
    </li>
  );
}

export function DiffView({ docId, diff }: { docId: string; diff: RevisionDiff }) {
  const total = diff.added.length + diff.removed.length + diff.changed.length + diff.moved.length;
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-[var(--text-2)]">
        {versionLabel(diff.fromRevisionNo)} → {versionLabel(diff.toRevisionNo).toLowerCase()}:{" "}
        <span className="num">{diff.changed.length}</span> diubah, <span className="num">{diff.added.length}</span> ditambah,{" "}
        <span className="num">{diff.removed.length}</span> dihapus, <span className="num">{diff.moved.length}</span> bergeser.
      </p>
      {total === 0 && <p className="text-[13px] text-[var(--text-2)]">Tidak ada perbedaan paragraf bernomor antara kedua versi.</p>}
      {GROUPS.map((g) => {
        const list = diff[g.kind];
        if (list.length === 0) return null;
        return (
          <section key={g.kind} aria-label={g.title} className="space-y-2">
            <div className="flex items-center gap-2">
              <Pill tone={g.tone}>{g.title}</Pill>
              <span className="num text-[11.5px] text-[var(--text-2)]">{list.length}</span>
            </div>
            <ul className="space-y-1.5">
              {list.map((e) => (
                <EntryRow key={`${g.kind}-${e.blockId}`} docId={docId} diff={diff} entry={e} kind={g.kind} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
