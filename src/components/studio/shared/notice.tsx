"use client";

/*
 * Notifikasi status + satu wilayah aria-live per halaman (FIX-4a; UX-01 §5.1,
 * §6.5; T-7: tanpa pustaka baru).
 *
 * - `notify({ message, tone, action })`: notifikasi singkat di pojok kanan
 *   bawah (`role="status"`), hilang setelah 5 s, berhenti saat fokus/hover,
 *   dapat ditutup. Nama tindakan sama dengan tombolnya ("Versi 4 disimpan").
 * - `announce(text)`: pengumuman pembaca layar saja (perubahan kelengkapan,
 *   pemindahan bagian, status pembuatan berkas) lewat satu `aria-live="polite"`.
 * - Galat tindakan TIDAK memakai notifikasi: tampilkan inline `role="alert"`
 *   dekat tombol pemicu (§5.1).
 * - `RefreshingIndicator`: "Memperbarui…" kecil saat memuat ulang dengan data lama.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, Loader2, TriangleAlert, X } from "lucide-react";

export type NoticeTone = "success" | "info" | "warn";

export interface NoticeInput {
  message: string;
  tone?: NoticeTone;
  /** Tindakan opsional, mis. { label: "Buka", onClick }. */
  action?: { label: string; onClick: () => void };
  /** Bawaan 5000 ms. */
  durationMs?: number;
}

interface NoticeItem extends Required<Pick<NoticeInput, "message" | "tone" | "durationMs">> {
  id: number;
  action?: NoticeInput["action"];
}

interface NoticeApi {
  notify: (n: NoticeInput) => void;
  announce: (text: string) => void;
}

const NoticeContext = createContext<NoticeApi | null>(null);

const NOOP: NoticeApi = { notify: () => {}, announce: () => {} };

/** API notifikasi; di luar provider menjadi no-op (tidak melempar). */
export function useNotice(): NoticeApi {
  return useContext(NoticeContext) ?? NOOP;
}

const MAX_VISIBLE = 3;

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [live, setLive] = useState("");
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const notify = useCallback((n: NoticeInput) => {
    seq.current += 1;
    const item: NoticeItem = {
      id: seq.current,
      message: n.message,
      tone: n.tone ?? "success",
      durationMs: n.durationMs ?? 5000,
      action: n.action,
    };
    setItems((xs) => [...xs, item].slice(-MAX_VISIBLE));
  }, []);

  const announce = useCallback((text: string) => {
    // Kosongkan dulu agar teks yang sama tetap diumumkan ulang.
    setLive("");
    window.setTimeout(() => setLive(text), 50);
  }, []);

  const api = useMemo(() => ({ notify, announce }), [notify, announce]);

  return (
    <NoticeContext.Provider value={api}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {live}
      </div>
      {/* Di ponsel di atas bilah tab bawah HQ (md:hidden, sekitar 4 rem). */}
      <div className="pointer-events-none fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {items.map((it) => (
          <NoticeToast key={it.id} item={it} onDismiss={dismiss} />
        ))}
      </div>
    </NoticeContext.Provider>
  );
}

const TONE: Record<NoticeTone, { color: string; Icon: typeof Info }> = {
  success: { color: "var(--up)", Icon: CheckCircle2 },
  info: { color: "var(--accent)", Icon: Info },
  warn: { color: "var(--warn)", Icon: TriangleAlert },
};

function NoticeToast({ item, onDismiss }: { item: NoticeItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const onClose = useCallback(() => onDismiss(item.id), [onDismiss, item.id]);
  const remaining = useRef(item.durationMs);
  const { color, Icon } = TONE[item.tone];

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const id = window.setTimeout(onClose, remaining.current);
    return () => {
      window.clearTimeout(id);
      remaining.current = Math.max(800, remaining.current - (Date.now() - started));
    };
  }, [paused, onClose]);

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="panel pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 text-[13px] text-[var(--text)] motion-safe:animate-[studio-notice-in_200ms_var(--ease,ease-out)]"
      style={{ borderColor: `color-mix(in srgb, ${color} 35%, var(--line))` }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} strokeWidth={2} aria-hidden />
      <p className="min-w-0 flex-1 leading-snug">{item.message}</p>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onClose();
          }}
          className="shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium text-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="-m-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

/** "Memperbarui…" — data lama tetap tampil (§5.1). */
export function RefreshingIndicator({ active, label = "Memperbarui…" }: { active: boolean; label?: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-2)]" role="status">
      <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}
