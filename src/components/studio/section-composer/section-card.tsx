"use client";

/*
 * Kartu satu bagian di Susunan dokumen (UX-01 W4). Baris kepala: pegangan
 * seret, nomor urut, nama awam, cara pengisian, sakelar Wajib, menu, dan
 * tombol buka/tutup. Isi terbuka: ≤ 8 pengaturan jenis bagian + Pengaturan
 * lanjutan (ADMIN). Pemindahan: seret (HTML5, nonaktif di layar sentuh),
 * Alt+Panah atas/bawah saat kartu difokus, atau menu Naikkan/Turunkan.
 * Bagian "Posisi tetap" tidak dapat dipindah; usaha memindahkannya memberi
 * pesan inline (mis. "Sampul selalu di awal").
 */
import { forwardRef, useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ChevronDown, GripVertical, Lock, MoreHorizontal } from "lucide-react";
import { Pill } from "@/components/ui/kit";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { sectionTypeLabel } from "@/components/studio/shared/labels";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { EssentialKnobSpec, SlotKindDef } from "./api";
import { AdvancedPanel } from "./advanced-panel";
import { KnobControl, Switch } from "./knob-control";
import { contentModeText, lockedPlace, readKnob, repeatText, resetKnob, tiersText, writeKnob, type Inherited, type Slot } from "./model";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export interface SectionCardProps {
  slot: Slot;
  index: number;
  total: number;
  kind: SlotKindDef | undefined;
  knobs: readonly EssentialKnobSpec[];
  inherited: Inherited;
  isAdmin: boolean;
  readOnly: boolean;
  expanded: boolean;
  dragEnabled: boolean;
  /** Pesan inline (mis. "Sampul selalu di awal"). */
  notice: string | null;
  /** Masalah pemeriksaan susunan untuk bagian ini. */
  problems: readonly string[];
  dropHint: "before" | "after" | null;
  onToggleExpand: () => void;
  onMove: (delta: -1 | 1) => void;
  onRequiredChange: (next: boolean) => void;
  onPatch: (next: Slot) => void;
  onRemove: () => void;
  onDragStart: (e: DragEvent<HTMLLIElement>) => void;
  onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  onDrop: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
}

function CardMenu({
  label,
  canUp,
  canDown,
  onMove,
  onRename,
  onRemove,
}: {
  label: string;
  canUp: boolean;
  canDown: boolean;
  onMove: (d: -1 | 1) => void;
  onRename: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (fn: () => void) => {
    setOpen(false);
    fn();
    btn.current?.focus();
  };
  const item = `flex w-full items-center whitespace-nowrap px-3 py-1.5 text-left text-[13px] hover:bg-[var(--surface-2)] ${FOCUS} aria-disabled:cursor-not-allowed aria-disabled:opacity-50`;

  return (
    <div
      ref={wrap}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          btn.current?.focus();
        }
      }}
    >
      <button
        ref={btn}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Tindakan untuk ${label}`}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] ${FOCUS}`}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <div id={menuId} className="panel absolute right-0 z-20 mt-1 min-w-[11rem] py-1 shadow-xl">
          <button type="button" className={item} aria-disabled={!canUp || undefined} onClick={() => pick(() => onMove(-1))}>
            Naikkan
          </button>
          <button type="button" className={item} aria-disabled={!canDown || undefined} onClick={() => pick(() => onMove(1))}>
            Turunkan
          </button>
          <button type="button" className={item} onClick={() => pick(onRename)}>
            Ganti nama
          </button>
          <div className="my-1 border-t border-[var(--line)]" />
          <button type="button" className={`${item} text-[var(--down)]`} onClick={() => pick(onRemove)}>
            Hapus bagian
          </button>
        </div>
      )}
    </div>
  );
}

export const SectionCard = forwardRef<HTMLLIElement, SectionCardProps>(function SectionCard(p, ref) {
  const { slot, index, total, kind, knobs, inherited, isAdmin, readOnly, expanded } = p;
  const id = useId();
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(slot.label);
  const name = slot.label?.trim() || sectionTypeLabel(slot.sectionType);
  const locked = slot.positionLocked;
  const repeat = repeatText(slot);
  const panelId = `${id}-panel`;
  const noticeId = `${id}-notice`;

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget || readOnly) return;
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      p.onMove(e.key === "ArrowUp" ? -1 : 1);
    }
  };

  const commitRename = () => {
    const v = nameDraft.trim();
    if (v && v !== slot.label) p.onPatch({ ...slot, label: v });
    setRenaming(false);
  };

  return (
    <li
      ref={ref}
      id={`bagian-${index + 1}`}
      tabIndex={0}
      aria-label={`${index + 1}. ${name}${locked ? `, posisi tetap ${lockedPlace(index, total)}` : readOnly ? "" : ", tekan Alt dan panah atas atau bawah untuk memindah"}`}
      aria-describedby={p.notice ? noticeId : undefined}
      draggable={p.dragEnabled && !locked && !readOnly && !renaming}
      onKeyDown={onKeyDown}
      onDragStart={p.onDragStart}
      onDragOver={p.onDragOver}
      onDrop={p.onDrop}
      onDragEnd={p.onDragEnd}
      className={`relative rounded-[12px] border bg-[var(--surface-1)] transition-colors duration-150 motion-reduce:transition-none ${FOCUS} ${
        p.problems.length ? "border-[color-mix(in_srgb,var(--down)_45%,var(--line))]" : "border-[var(--line)]"
      }`}
    >
      {p.dropHint && (
        <span
          aria-hidden
          className={`pointer-events-none absolute left-3 right-3 h-0.5 rounded bg-[var(--accent)] ${p.dropHint === "before" ? "-top-1.5" : "-bottom-1.5"}`}
        />
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <span
          aria-hidden
          className={`flex h-8 w-5 items-center justify-center ${locked || readOnly || !p.dragEnabled ? "text-[var(--line-strong)]" : "cursor-grab text-[var(--text-2)]"}`}
        >
          {locked ? <Lock className="h-3.5 w-3.5" strokeWidth={2} /> : <GripVertical className="h-4 w-4" strokeWidth={2} />}
        </span>
        <span className="num w-5 text-right text-[13px] text-[var(--text-2)]">{index + 1}</span>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              aria-label={`Nama baru untuk ${name}`}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setNameDraft(slot.label);
                  setRenaming(false);
                }
              }}
              className={`w-full max-w-xs rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 text-[14px] text-[var(--text)] ${FOCUS}`}
            />
          ) : (
            <p className="truncate text-[14px] font-medium text-[var(--text)]">{name}</p>
          )}
          <p className="mt-0.5 text-[12px] text-[var(--text-2)]">
            {contentModeText(slot.contentMode)}
            {repeat && ` · ${repeat}`}
            {slot.tiers.length > 0 && ` · Dipakai di: ${tiersText(slot)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {locked && (
            <Pill tone="neutral" className="whitespace-nowrap">
              <Lock className="mr-1 inline h-3 w-3 align-[-1px]" strokeWidth={2} aria-hidden />
              Posisi tetap: {index === 0 ? "awal" : index === total - 1 ? "akhir" : `ke-${index + 1}`}
            </Pill>
          )}
          <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-2)]">
            <span id={`${id}-req`}>Wajib</span>
            <Switch
              checked={slot.required}
              onChange={p.onRequiredChange}
              label={`Wajib: ${name}`}
              describedBy={`${id}-req`}
              disabled={readOnly}
            />
          </span>
          {!readOnly && (
            <CardMenu
              label={name}
              canUp={!locked && index > 0}
              canDown={!locked && index < total - 1}
              onMove={p.onMove}
              onRename={() => {
                setNameDraft(slot.label);
                setRenaming(true);
              }}
              onRemove={p.onRemove}
            />
          )}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? "Tutup" : "Buka"} pengaturan ${name}`}
            onClick={p.onToggleExpand}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] ${FOCUS}`}
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {p.notice && (
        <p id={noticeId} role="status" className="mx-3 mb-2 rounded-[8px] bg-[var(--surface-2)] px-3 py-1.5 text-[12.5px] text-[var(--text-2)]">
          {p.notice}
        </p>
      )}
      {p.problems.length > 0 && (
        <ul className="mx-3 mb-2 space-y-0.5 text-[12.5px] text-[var(--down)]">
          {p.problems.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      <div id={panelId} hidden={!expanded} className="border-t border-[var(--line)] px-4 pb-3 pt-1">
        {expanded && (
          <>
            <p className="pt-2 text-[12px] uppercase tracking-[0.08em] text-[var(--text-2)]">Pengaturan bagian {name}</p>
            {knobs.length === 0 ? (
              <p className="py-2 text-[12.5px] text-[var(--text-2)]">Bagian ini tidak punya pengaturan; tampilannya mengikuti gaya templat.</p>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {knobs.map((k) => {
                  const reading = readKnob(k, slot, inherited);
                  const inheritedValue = readKnob(k, resetKnob(k, slot, inherited), inherited).value;
                  return (
                    <KnobControl
                      key={k.id}
                      knob={k}
                      reading={reading}
                      inheritedValue={inheritedValue}
                      locked={k.class === "K" && !isAdmin}
                      readOnly={readOnly}
                      onChange={(v: ParamValue) => p.onPatch(writeKnob(k, slot, v, inherited))}
                      onReset={() => p.onPatch(resetKnob(k, slot, inherited))}
                    />
                  );
                })}
              </div>
            )}
            {isAdmin && !readOnly && <AdvancedPanel slot={slot} kind={kind} onPatch={p.onPatch} />}
            <InfoTeknis
              className="mt-2"
              items={{ slotKey: slot.slotKey, sectionType: slot.sectionType, contentMode: slot.contentMode, admits: slot.admits.length ? `${slot.admits.length} jenis` : "-" }}
            />
          </>
        )}
      </div>
    </li>
  );
});
