"use client";

import { useEffect, useState } from "react";

// ── Paging re-usable (10 baris/halaman, lazy render) ──────
// usePaged<T>(items, pageSize=10) → slice 1 halaman + kendali paging.
// Hanya 1 halaman (10 baris) yang dirender — sisanya lazily dirender saat
// pindah halaman. PagedBar = pager klasik; PagedLoadMore = pola lazy-load.

export const PAGE_SIZE = 10;

export interface Paged<T> {
  slice: T[];
  page: number;
  pageCount: number;
  total: number;
  start: number;
  pageSize: number;
  go: (p: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export function usePaged<T>(items: T[], pageSize: number = PAGE_SIZE): Paged<T> {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safe = Math.min(page, pageCount);

  // reset ke halaman 1 saat data berubah drastis (filter/ganti list)
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const go = (p: number) => setPage(Math.max(1, Math.min(pageCount, p)));
  const start = (safe - 1) * pageSize;

  return {
    slice: items.slice(start, start + pageSize),
    page: safe,
    pageCount,
    total: items.length,
    start,
    pageSize,
    go,
    next: () => go(safe + 1),
    prev: () => go(safe - 1),
    reset: () => setPage(1),
  };
}

// ── Pager klasik: ‹ Prev | 1 … N | Next › ────────────────
export function PagedBar({ p, className = "" }: { p: Paged<unknown>; className?: string }) {
  if (p.total <= p.pageSize) return null;
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= p.pageCount; i++) {
    if (i === 1 || i === p.pageCount || Math.abs(i - p.page) <= 2) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  const btn =
    "px-2 py-1 rounded-md text-[11px] font-medium border border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-[var(--line)] ${className}`}
    >
      <span className="num text-[11px] text-[var(--text-3)]">
        {p.start + 1}–{Math.min(p.start + p.pageSize, p.total)} dari {p.total} baris
      </span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={p.prev} disabled={p.page <= 1} className={btn}>
          ‹ Prev
        </button>
        {pages.map((pg, i) =>
          pg === "..." ? (
            <span key={`e${i}`} className="px-1 text-[11px] text-[var(--text-4)] select-none">
              …
            </span>
          ) : (
            <button
              key={pg}
              type="button"
              onClick={() => p.go(pg)}
              aria-current={pg === p.page ? "page" : undefined}
              className={`w-7 h-7 rounded-md text-[11px] font-medium border transition-colors ${
                pg === p.page
                  ? "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)]"
                  : "border-[var(--line)] text-[var(--text-3)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {pg}
            </button>
          )
        )}
        <button type="button" onClick={p.next} disabled={p.page >= p.pageCount} className={btn}>
          Next ›
        </button>
      </div>
    </div>
  );
}

// ── Pola lazy-load: "Muat 10 lagi" (slice tumbuh per halaman) ──
export function PagedLoadMore({
  p,
  label = "Muat lagi",
}: {
  p: Paged<unknown>;
  label?: string;
}) {
  if (p.total <= p.pageSize) return null;
  const remaining = p.total - (p.start + p.pageSize);
  return (
    <div className="px-4 py-3 flex items-center justify-center border-t border-[var(--line)]">
      {remaining <= 0 ? (
        <span className="num text-[11px] text-[var(--text-4)]">
          Menampilkan seluruh {p.total} baris
        </span>
      ) : (
        <button
          type="button"
          onClick={p.next}
          className="px-3 py-1.5 rounded-full text-[11.5px] font-medium border border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          {label} · {Math.min(p.pageSize, remaining)} lagi ({remaining} tersisa)
        </button>
      )}
    </div>
  );
}
