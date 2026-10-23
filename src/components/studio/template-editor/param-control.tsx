"use client";

/**
 * Kontrol masukan satu parameter, dipilih dari `ParamDef.type` registri.
 *
 * Kontrol berbasis teks menyimpan teks lokal; nilai yang dapat diurai langsung
 * diteruskan ke draf (galat rentang/tipe dihitung induk lewat
 * `validateParamValue`), teks yang tidak dapat diurai dilaporkan lewat
 * `onInvalid` dan tidak diteruskan. Induk me-remount kontrol (prop `key`)
 * saat nilai diatur ulang dari luar.
 */
import { useState } from "react";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { inputCls } from "./shared";
import { NUMERIC_TYPES, toCssHex, unitOf } from "./values";

export interface ParamControlProps {
  def: ParamDef;
  value: ParamValue;
  disabled: boolean;
  labelId: string;
  describedBy?: string;
  onChange: (v: ParamValue) => void;
  onInvalid: (message: string | null) => void;
}

const smallInput = `${inputCls} !py-1.5 !text-[12.5px]`;

function parseNumber(text: string, integer: boolean): number | string {
  const t = text.trim().replace(",", ".");
  if (!t) return "Wajib diisi";
  const n = Number(t);
  if (!Number.isFinite(n)) return "Harus angka";
  if (integer && !Number.isInteger(n)) return "Harus bilangan bulat";
  return n;
}

function NumberControl({ def, value, disabled, labelId, describedBy, onChange, onInvalid }: ParamControlProps) {
  const [text, setText] = useState(typeof value === "number" ? String(value) : "");
  const unit = unitOf(def.type);
  const nullable = def.default === null;
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        className={`${smallInput} max-w-[11rem]`}
        value={text}
        min={def.range?.min}
        max={def.range?.max}
        step={def.range?.step ?? (def.type === "int" ? 1 : "any")}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.trim() && nullable) {
            onInvalid(null);
            onChange(null);
            return;
          }
          const n = parseNumber(e.target.value, def.type === "int");
          if (typeof n === "string") onInvalid(n);
          else {
            onInvalid(null);
            onChange(n);
          }
        }}
      />
      {unit && <span className="text-[12px] text-[var(--text-3)]">{unit}</span>}
      {def.range && (def.range.min !== undefined || def.range.max !== undefined) && (
        <span className="text-[11.5px] text-[var(--text-3)]">
          rentang {def.range.min ?? "−∞"} – {def.range.max ?? "∞"}
        </span>
      )}
    </div>
  );
}

function HexControl({ value, disabled, labelId, describedBy, onChange, onInvalid }: ParamControlProps) {
  const [text, setText] = useState(typeof value === "string" ? value : "");
  const css = toCssHex(text);
  const commit = (t: string) => {
    setText(t);
    if (/^#?[0-9A-Fa-f]{6}$/.test(t.trim())) {
      onInvalid(null);
      onChange(t.trim().replace(/^#/, "").toUpperCase());
    } else onInvalid("Harus hex 6 digit, mis. 1F3A5F");
  };
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-7 w-7 shrink-0 rounded-md border border-[var(--line)]"
        style={{ background: css ?? "transparent", backgroundImage: css ? undefined : "repeating-linear-gradient(45deg,var(--line) 0 4px,transparent 4px 8px)" }}
      />
      <input
        type="color"
        className="h-7 w-9 cursor-pointer rounded border border-[var(--line)] bg-transparent disabled:cursor-not-allowed"
        value={css ?? "#000000"}
        disabled={disabled}
        aria-label="Pilih warna"
        onChange={(e) => commit(e.target.value.slice(1).toUpperCase())}
      />
      <input
        type="text"
        className={`${smallInput} max-w-[8rem] font-mono uppercase`}
        value={text}
        maxLength={7}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        onChange={(e) => commit(e.target.value)}
      />
    </div>
  );
}

function JsonControl({ value, disabled, labelId, describedBy, onChange, onInvalid }: ParamControlProps) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  return (
    <textarea
      className={`${smallInput} min-h-[5.5rem] font-mono !text-[12px]`}
      value={text}
      spellCheck={false}
      disabled={disabled}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      rows={Math.min(12, Math.max(3, text.split("\n").length))}
      onChange={(e) => {
        setText(e.target.value);
        try {
          const v = JSON.parse(e.target.value) as ParamValue;
          onInvalid(null);
          onChange(v);
        } catch (err) {
          onInvalid(`JSON tidak sah: ${err instanceof Error ? err.message : String(err)}`);
        }
      }}
    />
  );
}

function LinesControl({ value, disabled, labelId, describedBy, onChange, onInvalid }: ParamControlProps) {
  const [text, setText] = useState(() => (Array.isArray(value) ? value.map(String).join("\n") : ""));
  return (
    <div>
      <textarea
        className={`${smallInput} min-h-[4.5rem] !text-[12.5px]`}
        value={text}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        rows={Math.min(10, Math.max(3, text.split("\n").length))}
        onChange={(e) => {
          setText(e.target.value);
          onInvalid(null);
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
      />
      <p className="mt-1 text-[11px] text-[var(--text-3)]">Satu butir per baris; urutan dipertahankan.</p>
    </div>
  );
}

function MultiSelectControl({ def, value, disabled, labelId, onChange, onInvalid }: ParamControlProps) {
  const selected = new Set(Array.isArray(value) ? value.map(String) : []);
  const options = def.enum ?? [];
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-x-4 gap-y-1.5">
      {options.map((opt) => (
        <label key={opt} className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-2)]">
          <input
            type="checkbox"
            checked={selected.has(opt)}
            disabled={disabled}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(opt);
              else next.delete(opt);
              onInvalid(null);
              // Urutan mengikuti enum registri agar perbandingan versi stabil.
              onChange(options.filter((o) => next.has(o)));
            }}
          />
          <span className="font-mono">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function TwoNumberControl({ def, value, disabled, labelId, describedBy, onChange, onInvalid, labels }: ParamControlProps & { labels: [string, string] }) {
  const init = Array.isArray(value) ? value : [];
  const [a, setA] = useState(init[0] === undefined ? "" : String(init[0]));
  const [b, setB] = useState(init[1] === undefined ? "" : String(init[1]));
  const commit = (na: string, nb: string) => {
    const pa = parseNumber(na, false);
    const pb = parseNumber(nb, false);
    if (typeof pa === "string" || typeof pb === "string") {
      onInvalid(`${labels[0]}/${labels[1]}: ${typeof pa === "string" ? pa : pb}`);
      return;
    }
    if (def.type === "range" && pa > pb) {
      onInvalid(`${labels[0]} tidak boleh lebih besar dari ${labels[1]}`);
      return;
    }
    onInvalid(null);
    onChange([pa, pb]);
  };
  const common = {
    type: "number" as const,
    className: `${smallInput} max-w-[8rem]`,
    min: def.range?.min,
    max: def.range?.max,
    step: def.range?.step ?? "any",
    disabled,
    "aria-describedby": describedBy,
  };
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby={labelId}>
      <input {...common} aria-label={labels[0]} value={a} onChange={(e) => { setA(e.target.value); commit(e.target.value, b); }} />
      <span className="text-[12px] text-[var(--text-3)]">–</span>
      <input {...common} aria-label={labels[1]} value={b} onChange={(e) => { setB(e.target.value); commit(a, e.target.value); }} />
    </div>
  );
}

function TwoTextControl({ value, disabled, labelId, describedBy, onChange, onInvalid }: ParamControlProps) {
  const init = Array.isArray(value) ? value : [];
  const [a, setA] = useState(init[0] === undefined ? "" : String(init[0]));
  const [b, setB] = useState(init[1] === undefined ? "" : String(init[1]));
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-labelledby={labelId}>
      <input className={smallInput} aria-label="Nilai pertama" aria-describedby={describedBy} disabled={disabled} value={a} onChange={(e) => { setA(e.target.value); onInvalid(null); onChange([e.target.value, b]); }} />
      <input className={smallInput} aria-label="Nilai kedua" aria-describedby={describedBy} disabled={disabled} value={b} onChange={(e) => { setB(e.target.value); onInvalid(null); onChange([a, e.target.value]); }} />
    </div>
  );
}

function TextControl({ def, value, disabled, labelId, describedBy, onChange, onInvalid }: ParamControlProps) {
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value));
  const isChar = def.type === "char";
  return (
    <input
      type="text"
      className={`${smallInput} ${isChar ? "max-w-[5rem] text-center font-mono" : ""} ${def.type === "tokenRef" ? "font-mono" : ""}`}
      value={text}
      disabled={disabled}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      onChange={(e) => {
        setText(e.target.value);
        if (def.type === "ratio") {
          const t = e.target.value.trim().replace(",", ".");
          const n = Number(t);
          onInvalid(null);
          onChange(t !== "" && Number.isFinite(n) ? n : e.target.value);
          return;
        }
        onInvalid(null);
        onChange(e.target.value);
      }}
    />
  );
}

/** Pilih kontrol sesuai tipe registri. */
export function ParamControl(props: ParamControlProps) {
  const { def, value, disabled, labelId, describedBy, onChange, onInvalid } = props;
  const t = def.type;

  if (t === "bool") {
    return (
      <label className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-2)]">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--accent)]"
          checked={value === true}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          onChange={(e) => {
            onInvalid(null);
            onChange(e.target.checked);
          }}
        />
        {value === true ? "Ya" : "Tidak"}
      </label>
    );
  }
  if (NUMERIC_TYPES.has(t)) return <NumberControl {...props} />;
  if (t === "hex") return <HexControl {...props} />;
  if (t === "enum") {
    const opts = def.enum ?? [];
    const cur = typeof value === "string" ? value : "";
    return (
      <select
        className={`${smallInput} max-w-[22rem]`}
        value={cur}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        onChange={(e) => {
          onInvalid(null);
          onChange(e.target.value);
        }}
      >
        {!opts.includes(cur) && <option value={cur}>{cur || "(kosong)"}</option>}
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (t === "list") {
    if (def.enum && def.enum.length > 0) return <MultiSelectControl {...props} />;
    const sample = Array.isArray(value) ? value : Array.isArray(def.default) ? def.default : [];
    if (sample.every((x) => typeof x === "string")) return <LinesControl {...props} />;
    return <JsonControl {...props} />;
  }
  if (t === "range") {
    const v = Array.isArray(value) ? value : def.default;
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number")) return <TwoNumberControl {...props} labels={["Min", "Maks"]} />;
    return <JsonControl {...props} />;
  }
  if (t === "pair") {
    const v = Array.isArray(value) ? value : def.default;
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number")) return <TwoNumberControl {...props} labels={["Pertama", "Kedua"]} />;
    if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "string")) return <TwoTextControl {...props} />;
    return <JsonControl {...props} />;
  }
  if (t === "map" || t === "object") return <JsonControl {...props} />;
  return <TextControl {...props} />;
}

/** Tampilan hanya-baca untuk nilai kelas T atau kunci terkunci. */
export function ReadonlyValue({ def, value }: { def: ParamDef; value: ParamValue | undefined }) {
  if (value === undefined) return <span className="text-[12px] italic text-[var(--text-3)]">belum dihitung</span>;
  if (def.type === "hex") {
    const css = toCssHex(value);
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[12.5px] text-[var(--text-2)]">
        <span aria-hidden className="inline-block h-4 w-4 rounded border border-[var(--line)]" style={{ background: css ?? "transparent" }} />
        {String(value)}
      </span>
    );
  }
  if (value !== null && typeof value === "object") {
    return (
      <pre className="max-h-40 overflow-auto rounded-md bg-[var(--surface-1)] px-2 py-1 font-mono text-[11.5px] text-[var(--text-2)]">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  const unit = unitOf(def.type);
  return (
    <span className="font-mono text-[12.5px] text-[var(--text-2)]">
      {value === null ? "(kosong)" : typeof value === "boolean" ? (value ? "ya" : "tidak") : String(value)}
      {unit && typeof value === "number" ? ` ${unit}` : ""}
    </span>
  );
}
