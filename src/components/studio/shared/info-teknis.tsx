"use client";

/*
 * Panel "Info teknis" terlipat, hanya dirender untuk ADMIN (FIX-4a; UX-01 P3,
 * §2.2). Satu-satunya tempat kunci teknis (pid, slotKey, nomor revisi mentah,
 * sha, kode galat, correlationId, `forwardToController`) boleh tampil.
 * Untuk USER komponen ini tidak merender apa pun (bukan disembunyikan CSS).
 */
import type { ReactNode } from "react";
import { useViewer } from "./use-viewer";

export type InfoTeknisValue = string | number | boolean | null | undefined;

export function InfoTeknis({
  items,
  children,
  summary = "Info teknis",
  className = "",
}: {
  /** Pasangan label -> nilai; nilai kosong dilewati. */
  items?: Readonly<Record<string, InfoTeknisValue>>;
  children?: ReactNode;
  summary?: string;
  className?: string;
}) {
  const { isAdmin } = useViewer();
  if (!isAdmin) return null;
  const rows = Object.entries(items ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (rows.length === 0 && !children) return null;
  return (
    <details className={`group rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] text-[12px] ${className}`}>
      <summary className="cursor-pointer select-none rounded-[10px] px-3 py-2 text-[var(--text-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        {summary}
        <span className="ml-1.5 text-[11px] text-[var(--text-3)]">(admin)</span>
      </summary>
      <div className="space-y-2 border-t border-[var(--line)] px-3 py-2">
        {rows.length > 0 && (
          <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-1">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-[var(--text-2)]">{k}</dt>
                <dd className="min-w-0 break-all font-mono text-[11.5px] text-[var(--text)]">{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}
        {children}
      </div>
    </details>
  );
}
