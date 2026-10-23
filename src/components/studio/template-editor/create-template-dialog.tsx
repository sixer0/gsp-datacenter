"use client";

/**
 * Dialog "Buat templat" (UX-01 §3a langkah 0, W2): Nama templat + pilih gaya.
 * Susunan dokumen bawaan diambil dari gaya terpilih (R02 `definition` atau
 * R19), lalu R01 POST `studio.template/v2` dengan pengaturan kosong (nilai
 * mengikuti gaya). Slug dibangkitkan dari nama dan hanya terlihat di Info
 * teknis. Selesai: pindah ke `?langkah=pengaturan`.
 *
 * Penyimpangan tercatat: medan "Tingkat terbitan bawaan" W2 tidak dibuat —
 * tidak ada kenop esensial untuknya (registri SR-05), dan tingkat terbitan
 * dipilih per dokumen (D-153); mengirim kunci lanjutan dari USER ditolak 403.
 */
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { useNotice } from "@/components/studio/shared/notice";
import type { TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";
import { createTemplateV2, getSkeleton, getTemplateDetail, type PresetItem } from "./api";
import { slugFromName, type ParamRecord } from "./model";
import { StylePicker } from "./style-picker";

const NAME_MAX = 200;

export interface CopySource {
  name: string;
  presetSlug: string | null;
  essentials: ParamRecord;
  slots: TemplateSlotDef[] | null;
}

async function presetSlots(preset: PresetItem): Promise<TemplateSlotDef[] | null> {
  const d = await getTemplateDetail(preset.id);
  const own = d.definition?.skeleton?.slots;
  if (Array.isArray(own) && own.length > 0) return own;
  const sk = await getSkeleton(preset.id);
  return sk && sk.skeleton.slots.length > 0 ? sk.skeleton.slots : null;
}

export function CreateTemplateDialog({
  open,
  onClose,
  presets,
  isAdmin,
  copyFrom,
}: {
  open: boolean;
  onClose: () => void;
  presets: readonly PresetItem[];
  isAdmin: boolean;
  copyFrom?: CopySource | null;
}) {
  const router = useRouter();
  const { notify } = useNotice();
  const nameId = useId();
  const nameErrId = useId();
  const usable = presets.filter((p) => isAdmin || !p.restricted);
  const [name, setName] = useState(() => (copyFrom ? `Salinan ${copyFrom.name}`.slice(0, NAME_MAX) : ""));
  const [preset, setPreset] = useState<string | null>(() => copyFrom?.presetSlug ?? usable[0]?.slug ?? null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Beri nama templat, mis. Laporan Inspeksi Lapangan.");
      return;
    }
    const chosen = usable.find((p) => p.slug === preset);
    if (!chosen) {
      setError("Pilih satu gaya dokumen.");
      return;
    }
    setNameError(null);
    setError(null);
    setBusy(true);
    try {
      const slots = copyFrom?.slots && copyFrom.presetSlug === chosen.slug ? copyFrom.slots : await presetSlots(chosen);
      if (!slots) {
        setError("Susunan dokumen bawaan gaya ini belum dapat dibaca. Coba lagi nanti atau hubungi admin.");
        return;
      }
      const res = await createTemplateV2({
        slug: slugFromName(trimmed),
        name: trimmed,
        kind: "DOCUMENT",
        changeNote: copyFrom ? `Dibuat sebagai salinan ${copyFrom.name}` : `Templat baru dengan gaya ${chosen.name}`,
        template: {
          $schema: "studio.template/v2",
          preset: { slug: chosen.slug },
          essentials: copyFrom && copyFrom.presetSlug === chosen.slug ? { ...copyFrom.essentials } : {},
          skeleton: { slots },
        },
      });
      notify({ message: "Templat dibuat", tone: "success" });
      onClose();
      router.push(`/studio/templates/${encodeURIComponent(res.template.id)}?langkah=pengaturan`);
    } catch (e) {
      setError(errorMessages(e, { subject: "Templat" }).body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={copyFrom ? "Buat salinan templat" : "Buat templat"}
      description="Templat menentukan gaya dan susunan dokumen. Agen hanya mengisi kontennya."
      placement="center"
      dismissible={!busy}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={onClose} ariaDisabled={busy}>
            Batal
          </Button>
          <Button variant="primary" onClick={() => void submit()} ariaDisabled={busy} className="whitespace-nowrap">
            {busy ? "Membuat…" : copyFrom ? "Buat salinan" : "Buat templat"}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <label htmlFor={nameId} className="mb-1 block text-[12.5px] font-medium text-[var(--text)]">
            Nama templat
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            required
            aria-required="true"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrId : undefined}
            placeholder="Laporan Inspeksi Lapangan"
            className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          />
          {nameError && (
            <p id={nameErrId} className="mt-1 text-[12.5px] text-[var(--down)]">
              {nameError}
            </p>
          )}
        </div>
        <StylePicker presets={presets} value={preset} onChange={setPreset} isAdmin={isAdmin} name="create-template-style" />
        {copyFrom && copyFrom.presetSlug !== preset && (
          <p className="text-[12.5px] text-[var(--text-2)]">Dengan gaya lain, pengaturan dan susunan mengikuti bawaan gaya itu.</p>
        )}
        {error && (
          <p role="alert" className="text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Buat
        </button>
      </form>
    </Sheet>
  );
}
