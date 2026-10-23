"use client";

/*
 * Satu pengaturan bagian (kenop esensial jenis bagian; UX-01 W4, P7; D-165).
 * Label + satu kalimat bantuan (`aria-describedby`) + kontrol + "Kembalikan"
 * bila bagian ini mengubah nilai gaya. Kenop kelas K untuk non-ADMIN tampil
 * terkunci dengan alasan awam (§3a).
 */
import { useId, type ReactNode } from "react";
import { Lock } from "lucide-react";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { EssentialKnobSpec } from "./api";
import { knobValueText, sameValue, type KnobReading } from "./model";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  describedBy,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  describedBy?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-describedby={describedBy}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none ${FOCUS} ${
        checked ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_45%,var(--surface-2))]" : "border-[var(--line-strong)] bg-[var(--surface-2)]"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-4 rounded-full bg-[var(--text)] transition-transform duration-150 motion-reduce:transition-none ${checked ? "translate-x-[22px]" : "translate-x-[3px]"}`}
      />
    </button>
  );
}

export function KnobControl({
  knob,
  reading,
  inheritedValue,
  locked,
  readOnly,
  onChange,
  onReset,
}: {
  knob: EssentialKnobSpec;
  reading: KnobReading;
  /** Nilai gaya (untuk "Bawaan gaya: ..."). */
  inheritedValue: ParamValue | undefined;
  /** Kelas K dan penonton bukan ADMIN. */
  locked: boolean;
  readOnly: boolean;
  onChange: (v: ParamValue) => void;
  onReset: () => void;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const disabled = locked || readOnly || !reading.available;
  const v = reading.value;
  let control: ReactNode;

  if (knob.control === "bool") {
    control = <Switch id={id} checked={v === true} onChange={(n) => onChange(n)} label={knob.label} disabled={disabled} describedBy={helpId} />;
  } else if ((knob.control === "enum" || knob.control === "multiEnum") && knob.multiple && knob.options) {
    const selected = Array.isArray(v) ? v : [];
    control = (
      <fieldset aria-describedby={helpId} className="flex flex-wrap gap-1.5" disabled={disabled}>
        <legend className="sr-only">{knob.label}</legend>
        {knob.options.map((o) => {
          const on = selected.some((s) => sameValue(s, o.value));
          return (
            <label
              key={String(o.value)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                on ? "border-[var(--accent)] text-[var(--text)]" : "border-[var(--line-strong)] text-[var(--text-2)]"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={(e) => {
                  // Urutan mengikuti urutan pilihan registri.
                  const keep = knob.options!.filter((x) => (sameValue(x.value, o.value) ? e.target.checked : selected.some((s) => sameValue(s, x.value))));
                  onChange(keep.map((x) => x.value));
                }}
              />
              {o.label}
            </label>
          );
        })}
      </fieldset>
    );
  } else if (knob.control === "enum" && knob.options) {
    const idx = knob.options.findIndex((o) => sameValue(o.value, v));
    control = (
      <select
        id={id}
        aria-describedby={helpId}
        disabled={disabled}
        value={idx >= 0 ? String(idx) : ""}
        onChange={(e) => {
          const o = knob.options?.[Number(e.target.value)];
          if (o) onChange(o.value);
        }}
        className={`max-w-full rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[13px] text-[var(--text)] ${FOCUS} disabled:opacity-50`}
      >
        {idx < 0 && <option value="">Ikut gaya</option>}
        {knob.options.map((o, i) => (
          <option key={String(o.value)} value={String(i)}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (knob.control === "number") {
    control = (
      <input
        id={id}
        type="number"
        inputMode="decimal"
        aria-describedby={helpId}
        disabled={disabled}
        min={knob.range?.min}
        max={knob.range?.max}
        step={knob.range?.step}
        value={typeof v === "number" ? v : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n)) onChange(n);
        }}
        className={`num w-28 rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[13px] text-[var(--text)] ${FOCUS} disabled:opacity-50`}
      />
    );
  } else if (knob.control === "color") {
    control = (
      <input
        id={id}
        type="color"
        aria-describedby={helpId}
        disabled={disabled}
        value={typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 w-14 cursor-pointer rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] ${FOCUS} disabled:opacity-50`}
      />
    );
  } else {
    control = (
      <input
        id={id}
        type="text"
        aria-describedby={helpId}
        disabled={disabled}
        value={typeof v === "string" ? v : ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full max-w-xs rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[13px] text-[var(--text)] ${FOCUS} disabled:opacity-50`}
      />
    );
  }

  return (
    <div className="grid gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <label htmlFor={knob.control === "bool" || knob.multiple ? undefined : id} className="text-[13px] font-medium text-[var(--text)]">
          {knob.label}
        </label>
        <p id={helpId} className="mt-0.5 text-[12px] leading-snug text-[var(--text-2)]">
          {knob.help}
          {locked && (
            <span className="mt-1 flex items-center gap-1 text-[var(--text-2)]">
              <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
              Hanya admin yang dapat mengubah ini karena mengikat standar DATUM.
            </span>
          )}
          {!reading.available && <span className="mt-1 block">Nilai gaya untuk pengaturan ini belum tersedia.</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {control}
        {reading.explicit && !readOnly && !locked && (
          <button
            type="button"
            onClick={onReset}
            className={`whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] text-[var(--accent)] hover:underline ${FOCUS}`}
            title={`Bawaan gaya: ${knobValueText(knob, inheritedValue)}`}
          >
            Kembalikan ke bawaan gaya
          </button>
        )}
      </div>
    </div>
  );
}
