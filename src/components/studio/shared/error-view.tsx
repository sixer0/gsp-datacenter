"use client";

/*
 * Tampilan galat seragam Studio (FIX-4a; UX-01 §5.1, §6.4; menutup S86 R07).
 *
 * - `ErrorView`: judul awam + penjelasan + tindakan, coba ulang dengan hitung
 *   mundur 3/6/12 s (maks 3), "Masuk lagi" untuk 401, Info teknis (ADMIN).
 *   Dipakai galat muat (`useStudioQuery`) dan boundary segmen.
 * - `StudioSegmentError`: isi `app/studio/**\/error.tsx` — mencatat galat ke
 *   `client-log` sekali per galat, `[ Coba lagi ]` = `reset()` dengan jeda.
 *
 * Pesan server mentah tidak pernah tampil di permukaan utama.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, LogIn, RefreshCw } from "lucide-react";
import { Button, Panel } from "@/components/ui/kit";
import { reportClientError } from "./client-log";
import { errorMessages, type ErrorMessageContext } from "./error-messages";
import { isStudioApiError, studioSource } from "./http";
import { InfoTeknis } from "./info-teknis";
import { useCooldown, type CooldownState } from "./use-cooldown";

/**
 * `/login?next=<jalur saat ini>` (hanya jalur relatif internal). Tanpa
 * `useSearchParams` agar tidak memaksa Suspense/CSR pada halaman statis.
 */
export function loginHref(pathname: string | null, search?: string | null): string {
  const path = pathname && pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/studio";
  const next = search ? `${path}?${search}` : path;
  return `/login?next=${encodeURIComponent(next)}`;
}

export interface ErrorViewProps {
  error: unknown;
  /** Ganti judul katalog (mis. "Daftar dokumen tidak dapat dimuat"). */
  title?: string;
  context?: ErrorMessageContext;
  /** Aksi coba ulang. Tanpa ini tombol coba ulang tidak tampil. */
  onRetry?: () => void;
  /**
   * Status jeda dari pemanggil (mis. `useStudioQuery().cooldown`). Bila tidak
   * diberikan, ErrorView membuat jeda sendiri dan mempersenjatainya saat tampil.
   */
  cooldown?: CooldownState;
  /** Tindakan tambahan khusus layar (mis. tombol "Kembali ke Dokumen"). */
  actions?: ReactNode;
  /** Nilai Info teknis tambahan (ADMIN). */
  technical?: Record<string, string | number | null | undefined>;
  /** `panel` (bawaan) atau `inline` tanpa kartu. */
  variant?: "panel" | "inline";
  className?: string;
}

export function ErrorView({
  error,
  title,
  context,
  onRetry,
  cooldown: external,
  actions,
  technical,
  variant = "panel",
  className = "",
}: ErrorViewProps) {
  const msg = errorMessages(error, context);
  const own = useCooldown();
  const cd = external ?? own;
  const pathname = usePathname();
  const bodyId = useId();
  const { arm: armOwn, holdFor: holdOwn } = own;

  // Jeda sendiri: persenjatai sekali per galat bila pemanggil tidak memberi jeda.
  const armedFor = useRef<unknown>(null);
  useEffect(() => {
    if (external || !onRetry || !msg.retryable || armedFor.current === error) return;
    armedFor.current = error;
    armOwn();
    if (msg.retryAfterSec) holdOwn(msg.retryAfterSec);
  }, [error, external, onRetry, msg.retryable, msg.retryAfterSec, armOwn, holdOwn]);

  const showRetry = !!onRetry && msg.retryable;
  const isLogin = msg.actions.some((a) => a.kind === "login");
  const tech = {
    Kode: msg.code,
    Status: isStudioApiError(error) ? error.status : undefined,
    "Id korelasi": isStudioApiError(error) ? error.correlationId : undefined,
    Jalur: isStudioApiError(error) ? `${error.method} ${error.url}` : undefined,
    "Pesan server": isStudioApiError(error) ? error.message : error instanceof Error ? error.message : undefined,
    Digest: error && typeof error === "object" && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : undefined,
    ...technical,
  };

  const content = (
    <div role="alert" aria-describedby={bodyId} className="flex flex-col items-start gap-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-[14px] font-medium text-[var(--text)]">{title ?? msg.title}</p>
          <p id={bodyId} className="text-[13px] leading-relaxed text-[var(--text-2)]">
            {msg.body}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-[26px]">
        {isLogin && (
          <Button size="sm" variant="primary" href={loginHref(pathname)}>
            <LogIn className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Masuk lagi
          </Button>
        )}
        {showRetry && !cd.exhausted && (
          <Button
            size="sm"
            onClick={() => {
              if (cd.secondsLeft > 0) return;
              if (external) onRetry?.();
              else if (cd.trigger()) onRetry?.();
            }}
            ariaDisabled={cd.secondsLeft > 0}
            className="whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {cd.secondsLeft > 0 ? `Coba lagi (${cd.secondsLeft} dtk)` : "Coba lagi"}
          </Button>
        )}
        {actions}
      </div>
      {showRetry && cd.exhausted && (
        <p className="pl-[26px] text-[12.5px] text-[var(--text-2)]">Masih gagal. Muat ulang halaman atau hubungi admin.</p>
      )}
      <InfoTeknis items={tech} className="ml-[26px] w-[calc(100%-26px)]" />
    </div>
  );

  if (variant === "inline") return <div className={className}>{content}</div>;
  return <Panel className={`p-5 ${className}`}>{content}</Panel>;
}

/**
 * Isi boundary segmen `app/studio/**\/error.tsx`. Mencatat sekali per galat
 * (`studio.ui.boundary.<segmen>`), jeda coba ulang bertahan antar-pasang ulang
 * fallback (persistKey per segmen + jalur).
 */
export function StudioSegmentError({
  error,
  reset,
  segment,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Nama segmen untuk log, mis. "root", "document", "template". */
  segment: string;
}) {
  const pathname = usePathname();
  const cooldown = useCooldown(undefined, { persistKey: `boundary:${segment}:${pathname ?? ""}` });
  const { arm } = cooldown;
  const logged = useRef<unknown>(null);

  useEffect(() => {
    if (logged.current === error) return;
    logged.current = error;
    reportClientError(studioSource(`boundary.${segment}`), error, { digest: error.digest ?? null, route: pathname ?? null });
    arm();
  }, [error, segment, pathname, arm]);

  return (
    <ErrorView
      error={error}
      title="Bagian halaman ini gagal ditampilkan"
      onRetry={() => {
        if (cooldown.trigger()) reset();
      }}
      cooldown={cooldown}
      technical={{ Segmen: segment }}
    />
  );
}
