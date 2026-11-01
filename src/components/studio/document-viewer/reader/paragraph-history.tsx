"use client";

/*
 * Panel samping "Riwayat paragraf" (SR-30; UX-01 W8, §3c). Sumber: R16
 * `?history=1` (versi dokumen, waktu, oleh siapa). Teks per versi dimuat
 * malas lewat R16 `?rev=n` lalu dibandingkan dengan versi sebelumnya memakai
 * `revision/text-diff.tsx` (dipakai ulang, baca saja). "Pakai teks ini lagi"
 * mengisi editor; tetap melalui lembar perubahan (bukan pemulihan diam-diam).
 */
import { Skeleton } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { ErrorView } from "@/components/studio/shared/error-view";
import { formatDateTime, versionLabel } from "@/components/studio/shared/labels";
import { ActorName } from "@/components/studio/shared/raw-id";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { contentPlain, TextDiff } from "@/components/studio/revision/text-diff";
import { Button } from "@/components/ui/kit";
import type { BlockV2 } from "@/lib/studio/contract";
import { getParagraph } from "../doc-api";
import { changeScopeLabel, type PidHistoryEntry } from "../doc-model";

function useParagraphAt(id: string, pid: string, rev: number | null) {
  return useStudioQuery(rev ? `para:${id}:${pid}:${rev}` : null, (signal) => getParagraph(id, pid, { rev }, signal), {
    source: "documents.paragraph-history-text",
  });
}

function EntryDiff({ id, pid, rev, prevRev, onReuse }: { id: string; pid: string; rev: number; prevRev: number | null; onReuse?: (block: BlockV2) => void }) {
  const cur = useParagraphAt(id, pid, rev);
  const prev = useParagraphAt(id, pid, prevRev);
  if (cur.isLoading || (prevRev && prev.isLoading)) return <Skeleton className="h-10 w-full" />;
  if (cur.error && !cur.data) return <ErrorView variant="inline" error={cur.error} onRetry={cur.retry} cooldown={cur.cooldown} title="Teks versi ini tidak dapat dimuat" />;
  const after = contentPlain(cur.data?.content);
  const before = prevRev ? contentPlain(prev.data?.content) : "";
  const block = cur.data?.content as BlockV2 | undefined;
  return (
    <div className="space-y-2">
      <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-[13px] leading-relaxed text-[var(--text)]">
        {prevRev ? <TextDiff before={before} after={after} /> : <span className="whitespace-pre-wrap">{after}</span>}
      </div>
      {onReuse && block && (block.type === "paragraph" || block.type === "list") && (
        <Button size="sm" onClick={() => onReuse(block)} className="whitespace-nowrap">
          Pakai teks ini lagi
        </Button>
      )}
    </div>
  );
}

export function ParagraphHistory({
  open,
  id,
  pid,
  label,
  slotLabels,
  onClose,
  onReuse,
}: {
  open: boolean;
  id: string;
  pid: string | null;
  label: string;
  slotLabels: ReadonlyMap<string, string>;
  onClose: () => void;
  /** Tidak diberikan saat baca saja. */
  onReuse?: (block: BlockV2) => void;
}) {
  const q = useStudioQuery(open && pid ? `para-history:${id}:${pid}` : null, (signal) => getParagraph(id, pid!, { history: true }, signal), {
    source: "documents.paragraph-history",
  });
  const entries: PidHistoryEntry[] = [...(q.data?.history ?? [])].reverse();
  const latest = entries[0]?.revisionNo ?? null;

  return (
    <Sheet open={open} title={`Riwayat ${label.toLowerCase().startsWith("paragraf") ? label.charAt(0).toLowerCase() + label.slice(1) : label}`} onClose={onClose} placement="side">
      {q.isLoading && (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {q.error && !q.data && <ErrorView variant="inline" error={q.error} onRetry={q.retry} cooldown={q.cooldown} title="Riwayat tidak dapat dimuat" />}
      {q.data && entries.length === 0 && <p className="text-[13px] text-[var(--text-2)]">Belum ada riwayat untuk bagian ini.</p>}
      {entries.length > 0 && pid && (
        <ol className="space-y-4">
          {entries.map((e, i) => {
            const prev = entries[i + 1];
            const scope = changeScopeLabel(e.changeScope, slotLabels);
            return (
              <li key={`${e.revisionNo}-${i}`} className="space-y-1.5">
                <p className="text-[12.5px] text-[var(--text)]">
                  <span className="font-medium">{versionLabel(e.revisionNo)}</span>
                  <span className="text-[var(--text-2)]">
                    {" "}
                    · {formatDateTime(e.at)} · <ActorName by={e.by} />
                    {!prev ? " (dibuat)" : ""}
                    {e.retired ? " (dihapus)" : ""}
                  </span>
                </p>
                {scope && <p className="text-[12px] text-[var(--text-2)]">Lingkup: {scope}</p>}
                {!e.retired && (
                  <EntryDiff id={id} pid={pid} rev={e.revisionNo} prevRev={prev && !prev.retired ? prev.revisionNo : null} onReuse={e.revisionNo !== latest ? onReuse : undefined} />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Sheet>
  );
}
