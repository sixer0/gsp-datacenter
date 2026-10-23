"use client";

/**
 * Satu kenop esensial berlabel awam (UX-01 §3a langkah 2, W3): label, satu
 * kalimat bantuan, kontrol, dan "Kembalikan ke bawaan gaya (A4)" bila diubah.
 * Kenop kelas K untuk non-ADMIN tampil terkunci dengan alasan awam. Kunci
 * parameter rinci TIDAK tampil di sini (P3).
 */
import { useId, useState } from "react";
import { Lock, RotateCcw } from "lucide-react";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { EssentialKnob } from "./api";
import { colorSwatchValue, knobValueLabel } from "./model";
import { valuesEqual } from "./values";

export const K_LOCK_REASON = "Hanya admin yang dapat mengubah ini karena mengikat standar DATUM.";

const RADIO_MAX = 3;

const fieldCls =
  "rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-1.5 text-[13px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:opacity-60";

export interface EssentialKnobRowProps {
  knob: EssentialKnob;
  value: ParamValue | undefined;
  baseline: ParamValue | undefined;
  overridden: boolean;
  /** Kelas K untuk non-ADMIN. */
  locked: boolean;
  readOnly: boolean;
  onChange: (v: ParamValue) => void;
  onReset: () => void;
}

export function EssentialKnobRow({ knob, value, baseline, overridden, locked, readOnly, onChange, onReset }: EssentialKnobRowProps) {
  const labelId = useId();
  const helpId = useId();
  const lockId = useId();
  const disabled = locked || readOnly;
  const describedBy = [knob.help ? helpId : "", locked ? lockId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[minmax(9rem,13rem)_1fr]">
      <div className="min-w-0">
        <div id={labelId} className="text-[13px] font-medium text-[var(--text)]">
          {knob.label}
        </div>
        {knob.help && (
          <p id={helpId} className="mt-0.5 text-[12px] leading-snug text-[var(--text-2)]">
            {knob.help}
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <KnobControl knob={knob} value={value} disabled={disabled} labelId={labelId} describedBy={describedBy} onChange={onChange} />
        {locked && (
          <p id={lockId} className="flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
            <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
            {K_LOCK_REASON}
          </p>
        )}
        {overridden && !disabled && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--text-2)]">
            <span>Bawaan gaya: {knobValueLabel(knob, baseline)}</span>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden />
              Kembalikan ke bawaan gaya ({knobValueLabel(knob, baseline)})
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function KnobControl({
  knob,
  value,
  disabled,
  labelId,
  describedBy,
  onChange,
}: {
  knob: EssentialKnob;
  value: ParamValue | undefined;
  disabled: boolean;
  labelId: string;
  describedBy?: string;
  onChange: (v: ParamValue) => void;
}) {
  const name = useId();
  const opts = knob.options ?? [];

  if (knob.control === "enum" && opts.length > 0 && opts.length <= RADIO_MAX) {
    return (
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const checked = valuesEqual(o.value, value);
          return (
            <label
              key={o.label}
              className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1 text-[12.5px] transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                checked ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--text)]" : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--line-strong)]"
              } ${disabled ? "pointer-events-none opacity-60" : ""}`}
            >
              <input type="radio" name={name} checked={checked} disabled={disabled} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
    );
  }

  if (knob.control === "enum" && opts.length > 0) {
    const idx = opts.findIndex((o) => valuesEqual(o.value, value));
    return (
      <select
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        disabled={disabled}
        value={idx >= 0 ? String(idx) : ""}
        onChange={(e) => {
          const o = opts[Number(e.target.value)];
          if (o) onChange(o.value);
        }}
        className={`${fieldCls} min-w-[10rem]`}
      >
        {idx < 0 && <option value="">{knobValueLabel(knob, value)}</option>}
        {opts.map((o, i) => (
          <option key={o.label} value={String(i)}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (knob.control === "bool") {
    const on = value === true;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-2)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span className={`relative h-5 w-9 rounded-full border transition-colors duration-150 ${on ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-strong)] bg-[var(--surface-2)]"}`}>
          <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[var(--text)] transition-[left] duration-150 ${on ? "left-[18px]" : "left-0.5"}`} />
        </span>
        {on ? "Ya" : "Tidak"}
      </button>
    );
  }

  if (knob.control === "number") return <NumberKnob knob={knob} value={value} disabled={disabled} labelId={labelId} describedBy={describedBy} onChange={onChange} />;

  if (knob.control === "color") {
    // Registri menyimpan `hex` tanpa "#" (mis. "B45309"); swatch butuh "#RRGGBB".
    // Format tulis mengikuti nilai saat ini; bawaan = format registri (tanpa "#").
    const hex = colorSwatchValue(value);
    const withHash = typeof value === "string" && value.trim().startsWith("#");
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          disabled={disabled}
          value={hex}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            onChange(withHash ? v : v.replace(/^#/, ""));
          }}
          className="h-8 w-12 cursor-pointer rounded-[8px] border border-[var(--line)] bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="num text-[12.5px] text-[var(--text-2)]">{knobValueLabel(knob, value)}</span>
      </div>
    );
  }

  if (knob.control === "text") {
    return (
      <input
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        disabled={disabled}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        className={`${fieldCls} w-full max-w-sm`}
      />
    );
  }

  return <p className="text-[12.5px] text-[var(--text-2)]">{knobValueLabel(knob, value)} (diatur admin di gaya)</p>;
}

function NumberKnob({
  knob,
  value,
  disabled,
  labelId,
  describedBy,
  onChange,
}: {
  knob: EssentialKnob;
  value: ParamValue | undefined;
  disabled: boolean;
  labelId: string;
  describedBy?: string;
  onChange: (v: ParamValue) => void;
}) {
  const { min, max, step } = knob.range ?? {};
  const [text, setText] = useState(() => (typeof value === "number" ? String(value) : ""));
  const [shown, setShown] = useState<ParamValue | undefined>(value);
  const [invalid, setInvalid] = useState<string | null>(null);
  const errId = useId();
  // Nilai luar berubah (reset/ganti gaya): sinkronkan teks tanpa efek.
  if (!valuesEqual(shown, value)) {
    setShown(value);
    setText(typeof value === "number" ? String(value) : "");
    setInvalid(null);
  }
  const commit = (raw: string) => {
    setText(raw);
    const n = Number(raw.replace(",", "."));
    if (raw.trim() === "" || !Number.isFinite(n)) return setInvalid("Isi dengan angka.");
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) return setInvalid(`Pilih antara ${min?.toLocaleString("id-ID") ?? "-"} dan ${max?.toLocaleString("id-ID") ?? "-"}.`);
    setInvalid(null);
    setShown(n);
    onChange(n);
  };
  const unit = knob.keys[0]?.includes("size") ? "pt" : null;
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          aria-labelledby={labelId}
          aria-describedby={[describedBy, invalid ? errId : ""].filter(Boolean).join(" ") || undefined}
          aria-invalid={invalid ? true : undefined}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => commit(e.target.value)}
          className={`${fieldCls} num w-24`}
        />
        {unit && <span className="text-[12.5px] text-[var(--text-2)]">{unit}</span>}
      </div>
      {invalid && (
        <p id={errId} className="mt-1 text-[12px] text-[var(--down)]">
          {invalid}
        </p>
      )}
    </div>
  );
}
