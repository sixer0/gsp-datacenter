"use client";

/**
 * Stepper bersama editor templat (UX-01 §3a, W3/W4; dibuat SR-29, dipakai
 * SR-28 di `/sections`): Gaya > Pengaturan > Susunan dokumen > Simpan versi.
 * Setiap langkah adalah tautan (dapat dibuka di tab baru, berfungsi tanpa JS);
 * `onNavigate` boleh mencegat untuk penjaga perubahan belum disimpan (K-6) atau
 * pindah langkah di halaman yang sama tanpa muat ulang.
 */
import Link from "next/link";
import type { MouseEvent } from "react";
import { AlertCircle, Check, Circle } from "lucide-react";

export type TemplateStepId = "gaya" | "pengaturan" | "susunan" | "simpan";

export type TemplateStepStatus = "selesai" | "berubah" | "perhatian";

export const TEMPLATE_STEPS: ReadonlyArray<{ id: TemplateStepId; label: string }> = [
  { id: "gaya", label: "Gaya" },
  { id: "pengaturan", label: "Pengaturan" },
  { id: "susunan", label: "Susunan dokumen" },
  { id: "simpan", label: "Simpan versi" },
];

const STATUS_TEXT: Record<TemplateStepStatus, string> = {
  selesai: "selesai",
  berubah: "ada perubahan belum disimpan",
  perhatian: "perlu perhatian",
};

/** Tautan langkah: Gaya/Pengaturan/Simpan di editor (`?langkah=`), Susunan di `/sections`. */
export function templateStepHref(templateId: string, step: TemplateStepId): string {
  const base = `/studio/templates/${encodeURIComponent(templateId)}`;
  return step === "susunan" ? `${base}/sections` : `${base}?langkah=${step}`;
}

export interface TemplateStepperProps {
  templateId: string;
  current: TemplateStepId;
  statuses?: Partial<Record<TemplateStepId, TemplateStepStatus>>;
  /** Kembalikan `true` bila pemanggil sudah menangani navigasi (tautan bawaan dibatalkan). */
  onNavigate?: (step: TemplateStepId, href: string) => boolean;
  className?: string;
}

export function TemplateStepper({ templateId, current, statuses = {}, onNavigate, className = "" }: TemplateStepperProps) {
  return (
    <nav aria-label="Langkah mengatur templat" className={`overflow-x-auto ${className}`}>
      <ol className="flex min-w-max items-center gap-1.5 text-[13px]">
        {TEMPLATE_STEPS.map((s, i) => {
          const href = templateStepHref(templateId, s.id);
          const active = s.id === current;
          const st = statuses[s.id];
          const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            if (onNavigate?.(s.id, href)) e.preventDefault();
          };
          return (
            <li key={s.id} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-[var(--text-3)]">
                  ›
                </span>
              )}
              <Link
                href={href}
                onClick={onClick}
                aria-current={active ? "step" : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  active
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--text)]"
                    : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
                }`}
              >
                <StepMark n={i + 1} status={st} />
                <span>{s.label}</span>
                {st && st !== "selesai" && <span className="sr-only">({STATUS_TEXT[st]})</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepMark({ n, status }: { n: number; status?: TemplateStepStatus }) {
  if (status === "selesai") return <Check className="h-3.5 w-3.5 text-[var(--up)]" strokeWidth={2} aria-label="selesai" />;
  if (status === "perhatian") return <AlertCircle className="h-3.5 w-3.5 text-[var(--warn)]" strokeWidth={2} aria-hidden />;
  if (status === "berubah") return <Circle className="h-2.5 w-2.5 fill-[var(--warn)] text-[var(--warn)]" strokeWidth={2} aria-hidden />;
  return (
    <span aria-hidden className="num text-[11.5px] text-[var(--text-3)]">
      {n}
    </span>
  );
}
