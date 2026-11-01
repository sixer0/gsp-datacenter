"use client";

/**
 * Potongan UI kecil editor parameter lanjutan (ADMIN; S58, dirapikan SR-29).
 * Pemuat data, coba ulang, batas galat, dan pesan kini memakai fondasi
 * `@/components/studio/shared/*` (FIX-4a); yang tersisa di sini hanya gaya
 * medan dan lencana kelas yang tampil di panel "Pengaturan lanjutan".
 */
import { Pill } from "@/components/ui/kit";

export const inputCls =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:opacity-60";

/** UI-02 (L12): kelas izin parameter dalam kata awam (kode B/K/T hanya di Info teknis). */
export const CLASS_LABEL: Record<"B" | "K" | "T", string> = {
  B: "Bebas diubah",
  K: "Standar DATUM (admin)",
  T: "Dihitung otomatis",
};

export function ClassBadge({ cls, title }: { cls: "B" | "K" | "T"; title?: string }) {
  const tone = cls === "B" ? "up" : cls === "K" ? "warn" : "accent";
  return (
    <span title={title}>
      <Pill tone={tone} className="!px-2 !py-0.5 !text-[10.5px]">
        {CLASS_LABEL[cls]}
      </Pill>
    </span>
  );
}
