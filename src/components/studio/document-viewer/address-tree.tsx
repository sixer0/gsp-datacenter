"use client";

/*
 * Daftar isi dokumen di tab Baca (SR-30; UX-01 W7). Bagian sesuai urutan
 * susunan, bab dan subbab bernomor (nomor dokumen, bukan "alamat"); status
 * singkat per bagian (otomatis / belum diisi). Sticky di desktop, lembar bawah
 * di ponsel (dibungkus pemanggil). Nama berkas lama dipertahankan agar impor
 * tidak berubah; isi ditulis ulang SR-30.
 */
import type { ChapterV2, CompletenessReportV2, SlotNodeV2, StudioDocV2Resolved } from "@/lib/studio/contract";
import { slotLabel } from "@/components/studio/shared/labels";
import { chaptersOf, inlinePlain } from "./doc-model";

export interface TocProps {
  slots: readonly SlotNodeV2[];
  report: CompletenessReportV2 | null;
  content: StudioDocV2Resolved | undefined;
  active: string | null;
  onGo: (target: string) => void;
  footer?: React.ReactNode;
}

function chapterKeys(slot: SlotNodeV2, report: CompletenessReportV2 | null, chapters: ChapterV2[]): string[] {
  const prog = report?.chapters?.[slot.slotKey];
  const keys = new Set<string>([...chapters.map((c) => c.key), ...(prog?.expected ?? []), ...(prog?.missing ?? [])]);
  return [...keys].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
}

const LINK =
  "block w-full truncate rounded-md px-2 py-1 text-left hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] aria-[current=true]:bg-[var(--surface-2)] aria-[current=true]:text-[var(--text)]";

export function DocumentToc({ slots, report, content, active, onGo, footer }: TocProps) {
  return (
    <nav aria-label="Daftar isi dokumen" className="space-y-3 text-[12.5px]">
      <p className="px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-2)]">Daftar isi</p>
      <ul className="space-y-0.5 text-[var(--text-2)]">
        {slots
          .filter((s) => s.state !== "OMITTED")
          .map((s) => {
            const label = slotLabel(s.slotKey, s.label);
            const repeatable = s.sectionType === "chapter" || s.sectionType === "appendix";
            if (!repeatable) {
              const hint = s.state === "AUTO_READY" ? " (otomatis)" : s.state === "EMPTY" ? " (belum diisi)" : "";
              return (
                <li key={s.slotKey}>
                  <button type="button" onClick={() => onGo(s.slotKey)} aria-current={active === s.slotKey || undefined} className={LINK}>
                    {label}
                    {hint && <span className={s.state === "EMPTY" ? "text-[var(--down)]" : ""}>{hint}</span>}
                  </button>
                </li>
              );
            }
            const chapters = chaptersOf(content, s.slotKey);
            const byKey = new Map(chapters.map((c) => [c.key, c]));
            const keys = chapterKeys(s, report, chapters);
            const appendix = s.sectionType === "appendix";
            return (
              <li key={s.slotKey}>
                <button type="button" onClick={() => onGo(s.slotKey)} aria-current={active === s.slotKey || undefined} className={`${LINK} font-medium text-[var(--text)]`}>
                  {label}
                </button>
                {keys.length > 0 && (
                  <ul className="ml-2 space-y-0.5 border-l border-[var(--line)] pl-1.5">
                    {keys.map((k) => {
                      const c = byKey.get(k);
                      const target = `${s.slotKey}:${k}`;
                      const name = appendix ? `Lampiran ${k}` : `Bab ${k}`;
                      return (
                        <li key={k}>
                          <button type="button" onClick={() => onGo(target)} aria-current={active === target || undefined} className={LINK}>
                            {name}
                            {c ? ` ${inlinePlain(c.title)}` : <span className="text-[var(--down)]"> (belum ada)</span>}
                          </button>
                          {c && active?.startsWith(target) && c.sections.length > 0 && (
                            <ul className="ml-3 space-y-0.5">
                              {c.sections.map((sec, i) => (
                                <li key={sec.id ?? i}>
                                  <button type="button" onClick={() => onGo(`${target}:${i + 1}`)} className={`${LINK} text-[12px]`}>
                                    {k}.{i + 1} {inlinePlain(sec.title)}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
      </ul>
      {footer}
    </nav>
  );
}
