"use client";

/*
 * Dialog "Tambah bagian" (UX-01 W4, alur 3a langkah 3): pilih jenis bagian
 * yang diizinkan (C33, R03 `kind=slots`), masing-masing dengan deskripsi
 * awam; nama bagian dapat diubah. Memakai `Sheet` bersama (`<dialog>` bawaan).
 */
import { useState } from "react";
import { Button } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { sectionTypeLabel } from "@/components/studio/shared/labels";
import type { SlotKindDef } from "./api";
import { addBlockedReason, contentModeText, SECTION_TYPE_HELP, type Slot } from "./model";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function AddSectionDialog({
  open,
  kinds,
  slots,
  onAdd,
  onClose,
}: {
  open: boolean;
  kinds: readonly SlotKindDef[];
  slots: readonly Slot[];
  onAdd: (kind: SlotKindDef, label: string) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const kind = kinds.find((k) => k.sectionType === picked);

  const close = () => {
    setPicked(null);
    setLabel("");
    setError(null);
    onClose();
  };
  const submit = () => {
    if (!kind) {
      setError("Pilih jenis bagian lebih dulu.");
      return;
    }
    onAdd(kind, label.trim() || sectionTypeLabel(kind.sectionType));
    close();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      placement="center"
      title="Tambah bagian"
      description="Bagian baru ditaruh sebelum bagian berposisi tetap di akhir. Urutannya dapat diubah setelahnya."
      footer={
        <>
          <Button variant="ghost" onClick={close} className="whitespace-nowrap">
            Batal
          </Button>
          <Button variant="primary" onClick={submit} ariaDisabled={!kind} className="whitespace-nowrap">
            Tambah bagian
          </Button>
        </>
      }
    >
      {kinds.length === 0 ? (
        <p className="text-[13px] text-[var(--text-2)]">Daftar jenis bagian belum dapat dimuat. Tutup dialog lalu coba lagi.</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-[13px] font-medium text-[var(--text)]">Jenis bagian</legend>
          {kinds.map((k) => {
            const blocked = addBlockedReason(k, slots);
            const on = picked === k.sectionType;
            return (
              <label
                key={k.sectionType}
                className={`flex gap-3 rounded-[10px] border px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                  on ? "border-[var(--accent)] bg-[var(--surface-2)]" : "border-[var(--line)]"
                } ${blocked ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:bg-[var(--surface-2)]"}`}
              >
                <input
                  type="radio"
                  name="jenis-bagian"
                  className="mt-1"
                  disabled={!!blocked}
                  checked={on}
                  onChange={() => {
                    setPicked(k.sectionType);
                    setLabel(sectionTypeLabel(k.sectionType));
                    setError(null);
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-[var(--text)]">{sectionTypeLabel(k.sectionType)}</span>
                  <span className="block text-[12.5px] leading-snug text-[var(--text-2)]">{SECTION_TYPE_HELP[k.sectionType] ?? ""}</span>
                  <span className="mt-0.5 block text-[12px] text-[var(--text-2)]">
                    {contentModeText(k.defaultContentMode)}
                    {k.repeatable ? " · bisa berisi banyak" : ""}
                    {blocked ? ` · ${blocked}` : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
      {kind && (
        <label className="mt-4 block text-[13px] text-[var(--text)]">
          Nama bagian
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={`mt-1 block w-full rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[13px] text-[var(--text)] ${FOCUS}`}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[12.5px] text-[var(--down)]">
          {error}
        </p>
      )}
    </Sheet>
  );
}
