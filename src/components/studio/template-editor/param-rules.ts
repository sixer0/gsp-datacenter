/**
 * Aturan kelas dan validasi parameter sisi klien (S58), memakai logika
 * hanya-tipe S11 (`engine/tokens/merge.ts`) agar sama persis dengan server:
 * kelas bersyarat dari `classNote` (D-37), hak kelas K hanya ADMINISTRATOR
 * (KT-16), kelas T tidak pernah ditulis.
 */
import type { StudioTier } from "@/lib/studio/contract/enums";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { effectiveClass, validateParamValue } from "@/lib/studio/engine/tokens/merge";
import { hasOwn, valuesEqual, type ParamRecord } from "./values";

const TIERS: readonly string[] = ["NOTA", "TERBIT", "SERAH"];

export function tierOf(v: ParamValue | undefined): StudioTier | undefined {
  return typeof v === "string" && TIERS.includes(v) ? (v as StudioTier) : undefined;
}

export interface LockInfo {
  /** Kelas yang ditampilkan untuk nilai saat ini. */
  cls: "B" | "K" | "T";
  editable: boolean;
  /** Alasan terkunci, atau catatan hak bila dapat disunting. */
  reason: string | null;
}

export function lockOf(def: ParamDef, value: ParamValue | undefined, isAdmin: boolean, tier: StudioTier | undefined): LockInfo {
  if (def.class === "T") {
    const cls = effectiveClass(def, value ?? null, tier);
    if (cls === "B") return { cls: "B", editable: true, reason: `Pengecualian kelas T untuk tier ${tier ?? "tertentu"}: ${def.classNote ?? ""}`.trim() };
    return {
      cls: "T",
      editable: false,
      reason: `Kelas T: dihitung mesin${def.derive ? ` (fungsi ${def.derive})` : ""} dan dihitung ulang saat versi disimpan; tidak dapat ditimpa siapa pun.`,
    };
  }
  if (def.class === "K") {
    return isAdmin
      ? { cls: "K", editable: true, reason: "Kelas K terbuka karena sesi ADMINISTRATOR (KT-16)." }
      : { cls: "K", editable: false, reason: "Kelas K (kunci DATUM): hanya sesi ADMINISTRATOR yang dapat mengubah (KT-16)." };
  }
  const cls = effectiveClass(def, value ?? null, tier);
  return { cls, editable: true, reason: null };
}

/**
 * Galat per kunci untuk draf override: nilai tidak sah terhadap tipe/rentang,
 * atau kelas bersyarat yang naik ke K/T untuk nilai yang DIUBAH oleh
 * pengguna non-ADMINISTRATOR.
 */
export function draftErrors(
  defs: ReadonlyMap<string, ParamDef>,
  draft: ParamRecord,
  loaded: ParamRecord,
  isAdmin: boolean,
  tier: StudioTier | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(draft)) {
    const def = defs.get(key);
    if (!def) {
      out[key] = "Kunci tidak dikenal registri (hapus override ini).";
      continue;
    }
    const problem = validateParamValue(def, v);
    if (problem) {
      out[key] = `Nilai ${problem}.`;
      continue;
    }
    const changed = !hasOwn(loaded, key) || !valuesEqual(loaded[key], v);
    if (!changed) continue;
    const cls = effectiveClass(def, v, tier);
    if (cls === "T") out[key] = "Kelas T untuk tier ini: nilai dihitung mesin dan tidak dapat ditimpa.";
    else if (cls === "K" && !isAdmin) {
      out[key] =
        def.class === "K"
          ? "Kelas K: hanya ADMINISTRATOR yang dapat mengubah."
          : `Nilai ini menjadikan parameter kelas K (${def.classNote ?? "kelas bersyarat"}); hanya ADMINISTRATOR yang dapat menyimpannya.`;
    }
  }
  return out;
}
