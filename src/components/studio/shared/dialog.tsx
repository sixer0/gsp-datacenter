"use client";

/*
 * Dialog bersama Studio di atas `<dialog>` bawaan (FIX-4a; UX-01 §5.3, §6.5;
 * menutup S86 R11).
 *
 * - `showModal()` membuat sisa halaman inert: fokus terkurung di dialog
 *   (focus trap bawaan peramban) dan pembaca layar hanya melihat dialog.
 * - Fokus awal di tombol aman (Batal) pada `ConfirmDialog`; di `Sheet`, di
 *   elemen pertama yang dapat difokus (atau `initialFocusRef`).
 * - Esc = batal (event `cancel`), klik latar = batal.
 * - Fokus kembali ke elemen pemicu saat ditutup.
 * - `aria-labelledby` (judul) dan `aria-describedby` (deskripsi).
 * - Tombol bahaya: gaya ghost dengan teks `--down` dan kata kerja spesifik
 *   ("Hapus bagian"), tidak pernah "OK"/"Ya".
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/kit";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Inti: sinkronkan `open` dengan `showModal()/close()`, simpan dan pulihkan
 * fokus pemicu, dan teruskan Esc/klik latar ke `onDismiss`.
 */
function useNativeDialog(open: boolean, onDismiss: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      try {
        el.showModal();
      } catch {
        el.setAttribute("open", ""); // peramban lama: tetap tampil (tanpa inert)
      }
      const target = initialFocus?.current ?? el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open, initialFocus]);

  // Pulihkan fokus saat ditutup (oleh kode, Esc, atau unmount).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClose = () => {
      const r = returnFocus.current;
      returnFocus.current = null;
      if (r && r.isConnected) r.focus();
    };
    const onCancel = (e: Event) => {
      e.preventDefault(); // biarkan pemanggil yang menutup lewat `open`
      dismissRef.current();
    };
    el.addEventListener("close", onClose);
    el.addEventListener("cancel", onCancel);
    return () => {
      el.removeEventListener("close", onClose);
      el.removeEventListener("cancel", onCancel);
      if (el.open) {
        el.close();
        onClose(); // event `close` asinkron; pulihkan fokus langsung saat unmount
      }
    };
  }, []);

  /** Klik di latar (di luar kotak isi) = batal. */
  const onBackdropMouseDown = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) dismissRef.current();
  }, []);

  return { ref, onBackdropMouseDown };
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Teks konfirmasi (apa yang terjadi + akibatnya). */
  description: ReactNode;
  /** Kata kerja spesifik, mis. "Hapus bagian". */
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` = teks `--down`. */
  tone?: "danger" | "default";
  /** Boleh async; dialog menampilkan "Memproses…" dan tetap terbuka bila melempar. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  /** Medan tambahan (mis. "Mengapa" pada K-4). */
  children?: ReactNode;
  confirmDisabled?: boolean;
  /** Galat tindakan inline (role="alert"), mis. dari `errorMessages(e).body`. */
  error?: string | null;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  tone = "danger",
  onConfirm,
  onCancel,
  children,
  confirmDisabled,
  error,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const errId = useId();
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dismiss = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);
  const { ref, onBackdropMouseDown } = useNativeDialog(open, dismiss, cancelRef);

  const confirm = async () => {
    if (busy || confirmDisabled) return;
    setBusy(true);
    try {
      await onConfirm();
    } catch {
      /* pemanggil menampilkan galat lewat prop `error` */
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={onBackdropMouseDown}
      className="studio-dialog m-auto w-[min(30rem,calc(100vw-2rem))] rounded-[14px] border border-[var(--line-strong)] bg-[var(--surface-1)] p-0 text-[var(--text)] shadow-2xl"
    >
      <div className="space-y-4 p-5">
        <h2 id={titleId} className="text-[16px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        <div id={descId} className="text-[13px] leading-relaxed text-[var(--text-2)]">
          {description}
        </div>
        {children}
        {error && (
          <p id={errId} role="alert" className="text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            ref={cancelRef}
            type="button"
            onClick={dismiss}
            className="btn-ghost inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {cancelLabel}
          </button>
          <Button
            variant={tone === "danger" ? "ghost" : "primary"}
            onClick={() => void confirm()}
            ariaDisabled={busy || confirmDisabled}
            ariaDescribedBy={error ? errId : undefined}
            className={`whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${tone === "danger" ? "!text-[var(--down)]" : ""}`}
          >
            {busy ? "Memproses…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export interface SheetProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Tombol di kaki (mis. "Simpan versi 4"). */
  footer?: ReactNode;
  /**
   * `side` = panel kanan (desktop) / lembar bawah (ponsel); `center` = kotak
   * tengah (40rem); `wide` = hampir layar penuh untuk pratinjau PDF/halaman
   * (W9; FIX-4b atas permintaan SR-30).
   */
  placement?: "side" | "center" | "wide";
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Cegah tutup lewat Esc/latar (mis. saat menyimpan). */
  dismissible?: boolean;
}

export function Sheet({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  placement = "side",
  initialFocusRef,
  dismissible = true,
}: SheetProps) {
  const titleId = useId();
  const descId = useId();
  const dismiss = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);
  const { ref, onBackdropMouseDown } = useNativeDialog(open, dismiss, initialFocusRef);

  const box =
    placement === "center"
      ? "m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-[14px]"
      : placement === "wide"
        ? "m-auto h-[calc(100dvh-2rem)] max-h-none w-[min(80rem,calc(100vw-2rem))] max-w-none rounded-[14px]"
        : "mb-0 mt-auto w-full max-w-none max-h-[85dvh] rounded-t-[16px] sm:m-0 sm:ml-auto sm:h-[100dvh] sm:max-h-none sm:w-[min(32rem,100vw)] sm:rounded-none sm:rounded-l-[16px]";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onMouseDown={onBackdropMouseDown}
      className={`studio-dialog flex-col border border-[var(--line-strong)] bg-[var(--surface-1)] p-0 text-[var(--text)] shadow-2xl open:flex ${box}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-[16px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {description && (
            <div id={descId} className="mt-1 text-[12.5px] text-[var(--text-2)]">
              {description}
            </div>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tutup"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line)] px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {footer}
        </footer>
      )}
    </dialog>
  );
}
