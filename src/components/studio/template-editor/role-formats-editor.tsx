"use client";

/**
 * Editor `roleFormats` templat (70 peran, 01_specs.md §5.6) sebagai formulir
 * terstruktur: paragraf (`para`), run (`run`, `labelRun`, `numberRun`,
 * `markerRun`) per medan; struktur bersarang (tab, garis tepi, arsir, glyph,
 * sel) lewat JSON tervalidasi. Kosong = diwarisi (resolusi §5.6).
 */
import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { ROLE_KEYS, type RoleKey } from "@/lib/studio/contract/enums";
import type { RoleFormat, RoleFormatMap } from "@/lib/studio/contract/engine";
import { Pill } from "@/components/ui/kit";
import { inputCls } from "./shared";
import { toCssHex, valuesEqual } from "./values";

type Field =
  | { name: string; label: string; kind: "tw" | "int" | "halfPt"; min?: number; max?: number }
  | { name: string; label: string; kind: "enum"; options: readonly string[] }
  | { name: string; label: string; kind: "bool" }
  | { name: string; label: string; kind: "text" }
  | { name: string; label: string; kind: "hex" }
  | { name: string; label: string; kind: "json"; hint: string };

const PARA_FIELDS: readonly Field[] = [
  { name: "spacingBeforeTw", label: "Spasi sebelum", kind: "tw", min: 0 },
  { name: "spacingAfterTw", label: "Spasi sesudah", kind: "tw", min: 0 },
  { name: "lineTw", label: "Jarak baris", kind: "tw", min: 0 },
  { name: "lineRule", label: "Aturan baris", kind: "enum", options: ["auto", "exact", "atLeast"] },
  { name: "jc", label: "Perataan", kind: "enum", options: ["left", "right", "center", "both"] },
  { name: "indLeftTw", label: "Inden kiri", kind: "tw" },
  { name: "indRightTw", label: "Inden kanan", kind: "tw" },
  { name: "indHangingTw", label: "Inden gantung", kind: "tw", min: 0 },
  { name: "indFirstLineTw", label: "Inden baris pertama", kind: "tw", min: 0 },
  { name: "outlineLvl", label: "Tingkat outline (0-8)", kind: "int", min: 0, max: 8 },
  { name: "keepNext", label: "Bersama berikutnya", kind: "bool" },
  { name: "keepLines", label: "Baris tetap bersama", kind: "bool" },
  { name: "pageBreakBefore", label: "Pindah halaman sebelum", kind: "bool" },
  { name: "widowControl", label: "Kendali baris yatim", kind: "bool" },
  { name: "tabs", label: "Tab stop", kind: "json", hint: '[{"posTw":4536,"val":"right","leader":"dot"}]' },
  { name: "borders", label: "Garis tepi", kind: "json", hint: '{"bottom":{"val":"single","sz":4,"color":"1F3A5F"}}' },
  { name: "shading", label: "Arsir", kind: "json", hint: '{"fill":"F2F2F2","val":"clear"}' },
];

const RUN_FIELDS: readonly Field[] = [
  { name: "faceRole", label: "Peran wajah", kind: "enum", options: ["serif", "condensed", "mono", "workbookUi", "symbolGlyph"] },
  { name: "face", label: "Nama wajah (XOR peran)", kind: "text" },
  { name: "szHalfPt", label: "Ukuran", kind: "halfPt", min: 1 },
  { name: "color", label: "Warna", kind: "hex" },
  { name: "spacingTw", label: "Spasi huruf", kind: "tw" },
  { name: "u", label: "Garis bawah", kind: "enum", options: ["single", "none"] },
  { name: "vertAlign", label: "Posisi vertikal", kind: "enum", options: ["superscript", "subscript"] },
  { name: "b", label: "Tebal", kind: "bool" },
  { name: "i", label: "Miring", kind: "bool" },
  { name: "caps", label: "Kapital", kind: "bool" },
];

const RUN_PARTS = [
  { part: "run", label: "Run utama" },
  { part: "labelRun", label: "Run label" },
  { part: "numberRun", label: "Run nomor" },
  { part: "markerRun", label: "Run penanda" },
] as const;

type Obj = Record<string, unknown>;

export interface RoleFormatsEditorProps {
  loaded: RoleFormatMap;
  draft: RoleFormatMap;
  /** Label peran dari registri `?kind=roles` (opsional). */
  roleLabels: Readonly<Record<string, string>>;
  disabled: boolean;
  onChange: (role: RoleKey, fmt: RoleFormat | undefined) => void;
  onInvalid: (id: string, message: string | null) => void;
  /** Hapus galat lokal peran (dipanggil saat berpindah peran: kontrolnya di-remount). */
  onClearErrors: (prefix: string) => void;
  errors: Readonly<Record<string, string>>;
  epoch: number;
}

export function RoleFormatsEditor(p: RoleFormatsEditorProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RoleKey>(ROLE_KEYS[0]);
  const [revertEpoch, setRevertEpoch] = useState(0);
  const roles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROLE_KEYS.filter((r) => !q || r.toLowerCase().includes(q) || (p.roleLabels[r] ?? "").toLowerCase().includes(q));
  }, [query, p.roleLabels]);
  const grouped = useMemo(() => {
    const m = new Map<string, RoleKey[]>();
    for (const r of roles) {
      const g = r.split(".")[0];
      m.set(g, [...(m.get(g) ?? []), r]);
    }
    return [...m.entries()];
  }, [roles]);

  const fmt = (p.draft[selected] ?? {}) as RoleFormat;
  const changedRole = (r: RoleKey) => !valuesEqual(p.draft[r] ?? null, p.loaded[r] ?? null);
  const changedCount = ROLE_KEYS.filter(changedRole).length;

  const setPart = (part: string, next: Obj | undefined) => {
    const cur = { ...(fmt as Obj) };
    if (next && Object.keys(next).length > 0) cur[part] = next;
    else delete cur[part];
    p.onChange(selected, Object.keys(cur).length > 0 ? (cur as RoleFormat) : undefined);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr]">
      <nav aria-label="Daftar peran" className="lg:max-h-[70vh] lg:overflow-auto">
        <label className="relative mb-2 block">
          <span className="sr-only">Cari peran</span>
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-3)]" aria-hidden />
          <input type="search" className={`${inputCls} !pl-8`} placeholder="Cari peran" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <p className="mb-2 text-[11.5px] text-[var(--text-3)]">
          {ROLE_KEYS.length} peran · {changedCount} diubah
        </p>
        {grouped.map(([g, list]) => (
          <div key={g} className="mb-2">
            <div className="px-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--text-3)]">{g}</div>
            <ul>
              {list.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => {
                      if (r === selected) return;
                      p.onClearErrors(`${selected}.`);
                      setSelected(r);
                    }}
                    aria-current={r === selected ? "true" : undefined}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left font-mono text-[12px] ${
                      r === selected ? "bg-[var(--surface-1)] text-[var(--text)]" : "text-[var(--text-2)] hover:bg-[var(--surface-1)]"
                    }`}
                  >
                    <span className="truncate">{r}</span>
                    {changedRole(r) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-label="diubah" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div key={`${selected}:${p.epoch}:${revertEpoch}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-mono text-[14px] font-semibold text-[var(--text)]">{selected}</h3>
            {p.roleLabels[selected] && <p className="text-[12px] text-[var(--text-3)]">{p.roleLabels[selected]}</p>}
          </div>
          <div className="flex items-center gap-2">
            {changedRole(selected) && <Pill tone="warn">diubah</Pill>}
            {changedRole(selected) && !p.disabled && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] text-[var(--accent)] hover:bg-[var(--surface-1)]"
                onClick={() => {
                  p.onClearErrors(`${selected}.`);
                  p.onChange(selected, p.loaded[selected] as RoleFormat | undefined);
                  setRevertEpoch((n) => n + 1);
                }}
              >
                <RotateCcw className="h-3 w-3" aria-hidden /> Kembalikan peran
              </button>
            )}
          </div>
        </div>
        <p className="mb-3 text-[11.5px] text-[var(--text-3)]">
          Medan kosong diwarisi: format blok eksplisit &gt; roleFormats &gt; turunan katalog &gt; gaya Normal. Satuan tw = 1/20 pt.
        </p>

        <FieldSet title="Paragraf (para)" fields={PARA_FIELDS} value={(fmt as Obj).para as Obj | undefined} idPrefix={`${selected}.para`} {...p} onSet={(v) => setPart("para", v)} />
        {RUN_PARTS.map((rp) => (
          <FieldSet key={rp.part} title={`${rp.label} (${rp.part})`} fields={RUN_FIELDS} value={(fmt as Obj)[rp.part] as Obj | undefined} idPrefix={`${selected}.${rp.part}`} {...p} onSet={(v) => setPart(rp.part, v)} />
        ))}
        <JsonPart title="Run glyph per tanda provenans (glyphRun)" hint='{"est":{"i":true}}' value={(fmt as Obj).glyphRun} id={`${selected}.glyphRun`} {...p} onSet={(v) => setPart("glyphRun", v)} />
        <JsonPart title="Sel (cell: borders, marginsTw, shading)" hint='{"marginsTw":{"top":0,"bottom":0,"left":57,"right":57}}' value={(fmt as Obj).cell} id={`${selected}.cell`} {...p} onSet={(v) => setPart("cell", v)} />
      </div>
    </div>
  );
}

function FieldSet({
  title,
  fields,
  value,
  idPrefix,
  disabled,
  errors,
  onInvalid,
  onSet,
}: {
  title: string;
  fields: readonly Field[];
  value: Obj | undefined;
  idPrefix: string;
  disabled: boolean;
  errors: Readonly<Record<string, string>>;
  onInvalid: (id: string, m: string | null) => void;
  onSet: (v: Obj | undefined) => void;
}) {
  const cur = value ?? {};
  const setField = (name: string, v: unknown) => {
    const next = { ...cur };
    if (v === undefined) delete next[name];
    else next[name] = v;
    onSet(next);
  };
  return (
    <fieldset className="mb-4 rounded-xl border border-[var(--line)] px-3 pb-3 pt-1" disabled={disabled}>
      <legend className="px-1 text-[12.5px] font-semibold text-[var(--text)]">{title}</legend>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((f) => {
          const id = `${idPrefix}.${f.name}`;
          return (
            <div key={f.name} className={f.kind === "json" ? "sm:col-span-2 xl:col-span-3" : ""}>
              <FieldInput field={f} id={id} value={cur[f.name]} onValue={(v) => setField(f.name, v)} onInvalid={(m) => onInvalid(id, m)} />
              {errors[id] && (
                <p role="alert" className="mt-0.5 text-[11.5px] text-[var(--down)]">
                  {errors[id]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function domId(id: string): string {
  return `rf-${id.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

function FieldInput({ field, id, value, onValue, onInvalid }: { field: Field; id: string; value: unknown; onValue: (v: unknown) => void; onInvalid: (m: string | null) => void }) {
  const inputId = domId(id);
  const cls = `${inputCls} !py-1.5 !text-[12.5px]`;
  const [text, setText] = useState(() =>
    value === undefined ? "" : field.kind === "json" ? JSON.stringify(value, null, 2) : field.kind === "halfPt" && typeof value === "number" ? String(value / 2) : String(value),
  );
  const label = (
    <label htmlFor={inputId} className="mb-0.5 block text-[11.5px] text-[var(--text-3)]">
      {field.label}
      {field.kind === "tw" && typeof value === "number" ? ` (${(value / 20).toLocaleString("id-ID")} pt)` : ""}
    </label>
  );

  if (field.kind === "bool") {
    const v = value === true ? "true" : value === false ? "false" : "";
    return (
      <div>
        {label}
        <select id={inputId} className={cls} value={v} onChange={(e) => onValue(e.target.value === "" ? undefined : e.target.value === "true")}>
          <option value="">(diwarisi)</option>
          <option value="true">Ya</option>
          <option value="false">Tidak</option>
        </select>
      </div>
    );
  }
  if (field.kind === "enum") {
    return (
      <div>
        {label}
        <select id={inputId} className={cls} value={typeof value === "string" ? value : ""} onChange={(e) => onValue(e.target.value || undefined)}>
          <option value="">(diwarisi)</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.kind === "tw" || field.kind === "int" || field.kind === "halfPt") {
    return (
      <div>
        {label}
        <div className="flex items-center gap-1.5">
          <input
            id={inputId}
            type="number"
            className={cls}
            value={text}
            step={field.kind === "halfPt" ? 0.5 : 1}
            min={field.min}
            max={field.max}
            onChange={(e) => {
              setText(e.target.value);
              const t = e.target.value.trim();
              if (!t) {
                onInvalid(null);
                onValue(undefined);
                return;
              }
              const n = Number(t.replace(",", "."));
              const raw = field.kind === "halfPt" ? n * 2 : n;
              if (!Number.isFinite(n) || !Number.isInteger(raw)) return onInvalid(field.kind === "halfPt" ? "Ukuran harus kelipatan 0,5 pt" : "Harus bilangan bulat");
              if (field.min !== undefined && raw < field.min) return onInvalid(`Minimum ${field.min}`);
              if (field.max !== undefined && raw > field.max) return onInvalid(`Maksimum ${field.max}`);
              onInvalid(null);
              onValue(raw);
            }}
          />
          <span className="text-[11.5px] text-[var(--text-3)]">{field.kind === "halfPt" ? "pt" : field.kind === "tw" ? "tw" : ""}</span>
        </div>
      </div>
    );
  }
  if (field.kind === "hex") {
    const css = toCssHex(text);
    return (
      <div>
        {label}
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-6 w-6 shrink-0 rounded border border-[var(--line)]" style={{ background: css ?? "transparent" }} />
          <input
            id={inputId}
            type="text"
            className={`${cls} font-mono uppercase`}
            value={text}
            maxLength={7}
            placeholder="auto atau 1F3A5F"
            onChange={(e) => {
              setText(e.target.value);
              const t = e.target.value.trim().replace(/^#/, "");
              if (!t) {
                onInvalid(null);
                return onValue(undefined);
              }
              if (t === "auto" || /^[0-9A-Fa-f]{6}$/.test(t)) {
                onInvalid(null);
                onValue(t === "auto" ? "auto" : t.toUpperCase());
              } else onInvalid("Hex 6 digit atau auto");
            }}
          />
        </div>
      </div>
    );
  }
  if (field.kind === "json") {
    return (
      <div>
        {label}
        <textarea
          id={inputId}
          className={`${cls} min-h-[3.5rem] font-mono !text-[12px]`}
          value={text}
          placeholder={field.hint}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            if (!e.target.value.trim()) {
              onInvalid(null);
              return onValue(undefined);
            }
            try {
              const v = JSON.parse(e.target.value) as unknown;
              onInvalid(null);
              onValue(v);
            } catch {
              onInvalid("JSON tidak sah");
            }
          }}
        />
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        id={inputId}
        type="text"
        className={cls}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onInvalid(null);
          onValue(e.target.value.trim() || undefined);
        }}
      />
    </div>
  );
}

function JsonPart({
  title,
  hint,
  value,
  id,
  disabled,
  errors,
  onInvalid,
  onSet,
}: {
  title: string;
  hint: string;
  value: unknown;
  id: string;
  disabled: boolean;
  errors: Readonly<Record<string, string>>;
  onInvalid: (id: string, m: string | null) => void;
  onSet: (v: Obj | undefined) => void;
}) {
  const [text, setText] = useState(() => (value === undefined ? "" : JSON.stringify(value, null, 2)));
  const inputId = domId(id);
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="mb-1 block text-[12.5px] font-semibold text-[var(--text)]">
        {title}
      </label>
      <textarea
        id={inputId}
        className={`${inputCls} min-h-[3.5rem] font-mono !text-[12px]`}
        value={text}
        placeholder={hint}
        disabled={disabled}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.trim()) {
            onInvalid(id, null);
            return onSet(undefined);
          }
          try {
            const v = JSON.parse(e.target.value) as unknown;
            if (v === null || typeof v !== "object" || Array.isArray(v)) return onInvalid(id, "Harus objek JSON");
            onInvalid(id, null);
            onSet(v as Obj);
          } catch {
            onInvalid(id, "JSON tidak sah");
          }
        }}
      />
      {errors[id] && (
        <p role="alert" className="mt-0.5 text-[11.5px] text-[var(--down)]">
          {errors[id]}
        </p>
      )}
    </div>
  );
}
