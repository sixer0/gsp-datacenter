"use client";

/*
 * Pengaturan lanjutan per bagian — hanya ADMIN (D-163 T-1; UX-01 §2.2, P7).
 * Tidak dirender sama sekali untuk USER (bukan disembunyikan CSS). Terlipat
 * (`<details>`); daftar kunci yang sah dimuat malas saat panel dibuka (R03
 * `kind=paramScopes&sectionType=`). Di dalam panel ini kunci teknis boleh
 * tampil sebagai teks sekunder `font-mono` (§3a).
 */
import { useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { STUDIO_TIERS, type StudioSlotContentMode, type StudioTier } from "@/lib/studio/contract/enums";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { TIER_HINT, TIER_LABEL } from "@/components/studio/shared/labels";
import { getAdvancedKeys, type SlotKindDef } from "./api";
import { Switch } from "./knob-control";
import { contentModeText, type Slot } from "./model";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const INPUT = `rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[13px] text-[var(--text)] ${FOCUS}`;

/** Teks masukan -> nilai: true/false/null/angka/larik-objek berformat, selain itu teks. */
function parseValue(raw: string): ParamValue {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (t !== "" && Number.isFinite(Number(t))) return Number(t);
  if (/^[[{"]/.test(t)) {
    try {
      return JSON.parse(t) as ParamValue;
    } catch {
      return raw;
    }
  }
  return raw;
}

function showValue(v: ParamValue): string {
  return typeof v === "string" ? v : JSON.stringify(v);
}

function AdvancedKeys({ slot, onPatch }: { slot: Slot; onPatch: (next: Slot) => void }) {
  const [query, setQuery] = useState("");
  const keysQ = useStudioQuery(`registry:advanced:${slot.sectionType}`, (s) => getAdvancedKeys(slot.sectionType, s), {
    source: "section-composer.advanced-keys",
  });
  const advanced = slot.advanced;
  const entries = Object.entries(advanced ?? {});
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !keysQ.data) return [];
    const used = new Set(Object.keys(advanced ?? {}));
    return keysQ.data.filter((d) => !used.has(d.key) && (d.key.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))).slice(0, 8);
  }, [query, keysQ.data, advanced]);

  const setEntry = (key: string, value: ParamValue | undefined) => {
    const adv: Record<string, ParamValue> = { ...(slot.advanced ?? {}) };
    if (value === undefined) delete adv[key];
    else adv[key] = value;
    onPatch({ ...slot, advanced: adv });
  };

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-[var(--text-2)]">Pengaturan rinci yang menimpa nilai gaya untuk bagian ini saja.</p>
      {entries.length === 0 && <p className="text-[12px] text-[var(--text-2)]">Belum ada pengaturan rinci.</p>}
      <ul className="space-y-1.5">
        {entries.map(([k, v]) => (
          <li key={k} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 break-all font-mono text-[11.5px] text-[var(--text-2)]">{k}</span>
            <input
              key={showValue(v)}
              aria-label={`Nilai ${k}`}
              defaultValue={showValue(v)}
              onBlur={(e) => setEntry(k, parseValue(e.target.value))}
              className={`${INPUT} w-48 font-mono text-[12px]`}
            />
            <button
              type="button"
              onClick={() => setEntry(k, undefined)}
              aria-label={`Hapus pengaturan ${k}`}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--down)] ${FOCUS}`}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <div>
        <label className="text-[12px] text-[var(--text-2)]">
          Tambah pengaturan rinci
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama pengaturan"
            className={`${INPUT} mt-1 block w-full max-w-sm`}
          />
        </label>
        {keysQ.error && <p className="mt-1 text-[12px] text-[var(--down)]" role="alert">Daftar pengaturan rinci tidak dapat dimuat.</p>}
        {matches.length > 0 && (
          <ul className="mt-1 max-w-sm divide-y divide-[var(--line)] rounded-[8px] border border-[var(--line)]">
            {matches.map((d) => (
              <li key={d.key}>
                <button
                  type="button"
                  onClick={() => {
                    setEntry(d.key, "");
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-[var(--surface-2)] ${FOCUS}`}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--text-2)]" strokeWidth={2} aria-hidden />
                  <span className="min-w-0 break-all font-mono text-[11.5px] text-[var(--text)]">{d.key}</span>
                  {d.class === "K" && <span className="ml-auto text-[11px] text-[var(--text-2)]">standar DATUM</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AdvancedPanel({ slot, kind, onPatch }: { slot: Slot; kind: SlotKindDef | undefined; onPatch: (next: Slot) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const unit = slot.sectionType === "appendix" ? "lampiran" : "bab";
  const setCount = (field: "minItems" | "maxItems", raw: string) => {
    const next = { ...slot };
    const n = Number(raw);
    if (raw === "" || !Number.isInteger(n) || n < 0) delete next[field];
    else next[field] = n;
    onPatch(next);
  };
  const toggleTier = (t: StudioTier, on: boolean) => {
    const set = new Set(slot.tiers);
    if (on) set.add(t);
    else set.delete(t);
    onPatch({ ...slot, tiers: STUDIO_TIERS.filter((x) => set.has(x)) });
  };

  return (
    <details
      className="group mt-2 rounded-[10px] border border-[var(--line)]"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className={`cursor-pointer select-none rounded-[10px] px-3 py-2 text-[12.5px] text-[var(--text-2)] hover:text-[var(--text)] ${FOCUS}`}>
        Pengaturan lanjutan <span className="text-[11px]">(admin)</span>
      </summary>
      {open && (
        <div className="space-y-4 border-t border-[var(--line)] px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <span id={`${id}-lock`} className="text-[13px] text-[var(--text)]">
                Posisi tetap
              </span>
              <Switch checked={slot.positionLocked} label="Posisi tetap" describedBy={`${id}-lock`} onChange={(n) => onPatch({ ...slot, positionLocked: n })} />
            </div>
            {kind && kind.contentModes.length > 1 && (
              <label className="flex items-center justify-between gap-3 text-[13px] text-[var(--text)]">
                Cara pengisian
                <select
                  value={slot.contentMode}
                  onChange={(e) => onPatch({ ...slot, contentMode: e.target.value as StudioSlotContentMode })}
                  className={INPUT}
                >
                  {kind.contentModes.map((m) => (
                    <option key={m} value={m}>
                      {contentModeText(m)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {slot.repeatable && (
              <>
                <label className="flex items-center justify-between gap-3 text-[13px] text-[var(--text)]">
                  {`Minimum ${unit}`}
                  <input type="number" min={0} value={slot.minItems ?? ""} onChange={(e) => setCount("minItems", e.target.value)} className={`${INPUT} num w-20`} />
                </label>
                <label className="flex items-center justify-between gap-3 text-[13px] text-[var(--text)]">
                  {`Maksimum ${unit}`}
                  <input type="number" min={0} value={slot.maxItems ?? ""} onChange={(e) => setCount("maxItems", e.target.value)} className={`${INPUT} num w-20`} placeholder="-" />
                </label>
              </>
            )}
          </div>
          <fieldset>
            <legend className="text-[13px] text-[var(--text)]">Dipakai di tingkat terbitan</legend>
            <p className="text-[12px] text-[var(--text-2)]">Tanpa centang berarti dipakai di semua tingkat terbitan.</p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {STUDIO_TIERS.map((t) => (
                <label key={t} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text)]" title={TIER_HINT[t]}>
                  <input type="checkbox" checked={slot.tiers.includes(t)} onChange={(e) => toggleTier(t, e.target.checked)} className={FOCUS} />
                  {TIER_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>
          <AdvancedKeys slot={slot} onPatch={onPatch} />
        </div>
      )}
    </details>
  );
}
