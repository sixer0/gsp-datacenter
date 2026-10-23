/**
 * Rujukan parameter registri (`P4V-01..16`, `P4T-S01`, `toc.levels`, teks bebas)
 * untuk saringan editor lanjutan (`?paramFilter=`). Disalin dari
 * `section-composer/model.ts` (S59) agar editor templat tidak bergantung pada
 * modul yang sedang ditulis ulang SR-28.
 */
import type { ParamDef } from "@/lib/studio/contract/types/params";

export interface ParamRefInfo {
  ref: string;
  kind: "range" | "id" | "key" | "text";
  /** Id parameter registri yang cocok (kosong untuk teks bebas). */
  ids: string[];
}

const RANGE_RE = /^([A-Z][A-Z0-9]*)-([A-Z]?)(\d+)\.\.([A-Z]?)(\d+)$/;
const ID_RE = /^([A-Z][A-Z0-9]*)-([A-Z]?\d+)$/;
const KEY_RE = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/;

function matchId(params: readonly ParamDef[], id: string): string[] {
  return params.filter((p) => p.id === id || p.id.startsWith(`${id}-`)).map((p) => p.id);
}

export function expandParamRef(ref: string, params: readonly ParamDef[]): ParamRefInfo {
  const r = ref.trim();
  const range = RANGE_RE.exec(r);
  if (range && (range[4] === "" || range[4] === range[2])) {
    const [, group, letter, a, , b] = range;
    const from = Number(a);
    const to = Number(b);
    const ids: string[] = [];
    if (to >= from && to - from <= 200) {
      for (let n = from; n <= to; n += 1) ids.push(...matchId(params, `${group}-${letter}${String(n).padStart(a.length, "0")}`));
    }
    return { ref: r, kind: "range", ids };
  }
  if (ID_RE.test(r)) return { ref: r, kind: "id", ids: matchId(params, r) };
  if (KEY_RE.test(r)) {
    return { ref: r, kind: "key", ids: params.filter((p) => p.key === r || p.key.startsWith(`${r}.`)).map((p) => p.id) };
  }
  return { ref: r, kind: "text", ids: [] };
}
