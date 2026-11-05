/**
 * Utilitas parameter untuk editor templat (S101, dipakai S58): pencarian kunci/
 * label, pengelompokan per kategori lalu subkelompok namespace (U04: helper bersama
 * `groupByCategory` dari editor, tanpa pengelompokan bab), penanda kelas B/K/T, dan
 * reset ke induk. Fungsi murni atas `ParamDef[]` dari
 * GET /api/studio/registry?kind=params (lihat `fetchParamRegistry`).
 */
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { categoryOf, groupByCategory, type ParamCategory, type ParamCategoryId } from "@/components/studio/template-editor/param-categories";

export type ParamClass = ParamDef["class"];

/** Penanda kelas: B bebas, K terkunci admin, T turunan (hanya baca). */
export const PARAM_CLASS_BADGE: Readonly<Record<ParamClass, { short: string; label: string; description: string }>> = {
  B: { short: "B", label: "Bebas", description: "Boleh diubah semua pengguna." },
  K: { short: "K", label: "Kunci", description: "Hanya administrator yang boleh mengubah." },
  T: { short: "T", label: "Turunan", description: "Dihitung dari parameter lain; tidak dapat diubah." },
};

/** Parameter dapat disunting di editor? T tidak pernah; K hanya admin. */
export function isParamEditable(p: Pick<ParamDef, "class" | "inactive">, isAdmin: boolean): boolean {
  if (p.inactive) return false;
  if (p.class === "T") return false;
  return p.class === "B" || isAdmin;
}

/** Huruf kecil, tanpa diakritik, spasi dirapatkan. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface ParamSearchOptions {
  classes?: readonly ParamClass[];
  /** Kategori editor (`param-categories`), menggantikan saringan bab. */
  category?: ParamCategoryId;
  namespace?: string;
  /** Sertakan parameter nonaktif (P15 workbook/brief). Default true. */
  includeInactive?: boolean;
}

/**
 * Cari parameter berdasarkan kunci, label, id, atau rujukan aturan. Semua kata
 * kueri harus cocok (AND). Urutan: kunci/id persis, awalan kunci, lalu sisanya
 * dalam urutan registri.
 */
export function searchParams(params: readonly ParamDef[], query: string, opts: ParamSearchOptions = {}): ParamDef[] {
  const terms = norm(query).split(" ").filter(Boolean);
  const q = norm(query);
  const filtered = params.filter(
    (p) =>
      (!opts.classes || opts.classes.length === 0 || opts.classes.includes(p.class)) &&
      (!opts.category || categoryOf(p) === opts.category) &&
      (!opts.namespace || p.namespace === opts.namespace) &&
      (opts.includeInactive !== false || !p.inactive),
  );
  if (terms.length === 0) return filtered;
  const scored: Array<{ p: ParamDef; score: number; i: number }> = [];
  filtered.forEach((p, i) => {
    const key = norm(p.key);
    const id = norm(p.id);
    const hay = `${key} ${norm(p.label)} ${id} ${norm(p.ruleRef)}`;
    if (!terms.every((t) => hay.includes(t))) return;
    const score = key === q || id === q ? 0 : key.startsWith(q) ? 1 : norm(p.label).startsWith(q) ? 2 : 3;
    scored.push({ p, score, i });
  });
  scored.sort((a, b) => a.score - b.score || a.i - b.i);
  return scored.map((s) => s.p);
}

export interface ParamNamespaceGroup {
  /** Open-state: `ns:<categoryId>:<subkelompok>`. */
  id: string;
  /** Namespace, atau `chart.kind` / `type.scale` (S1). */
  namespace: string;
  /** Label subkelompok bergantung kategori. */
  label: string;
  params: ParamDef[];
  counts: Record<ParamClass, number>;
}

export interface ParamCategorySection {
  /** Open-state: `cat:<categoryId>`. */
  id: string;
  category: ParamCategory;
  namespaces: ParamNamespaceGroup[];
  total: number;
  counts: Record<ParamClass, number>;
  /** Tampil datar tanpa subkelompok (aturan bersama `showSubgroups`, D-632). */
  flat: boolean;
}

function emptyCounts(): Record<ParamClass, number> {
  return { B: 0, K: 0, T: 0 };
}

/**
 * Kelompokkan per kategori lalu subkelompok lewat `groupByCategory` (satu pemetaan dengan
 * editor; urutan kategori tetap, kategori kosong disembunyikan), ditambah hitungan kelas.
 * Urutan parameter di dalam subkelompok mengikuti masukan.
 */
export function groupParamsByCategory(params: readonly ParamDef[]): ParamCategorySection[] {
  return groupByCategory(params).map((g) => {
    const counts = emptyCounts();
    const namespaces = g.subgroups.map((sg) => {
      const c = emptyCounts();
      for (const p of sg.defs) c[p.class] += 1;
      counts.B += c.B;
      counts.K += c.K;
      counts.T += c.T;
      return { id: sg.id, namespace: sg.key, label: sg.label, params: sg.defs, counts: c };
    });
    return { id: g.id, category: g.category, namespaces, total: g.total, counts, flat: g.flat };
  });
}

/**
 * Kunci parameter yang dirujuk pointer isu validasi, atau null: v1 `/document/overrides/<kunci>`;
 * draf templat v2 (FIX-V) `/draftTemplate/template/(essentials|advanced)/<kunci>` dan kenop slot
 * `/draftTemplate/template/skeleton/slots/<n>/(essentials|advanced)/<kunci>`.
 */
export function paramKeyFromPointer(pointer: string): string | null {
  const m =
    /^(?:\/document|\/spec)?\/overrides\/(.+)$/.exec(pointer) ??
    /^\/draftTemplate\/template\/(?:skeleton\/slots\/\d+\/)?(?:essentials|advanced)\/([^/]+)/.exec(pointer);
  if (!m) return null;
  // JSON Pointer: ~1 -> "/", ~0 -> "~" (urutan ini sesuai RFC 6901).
  return m[1].replace(/~1/g, "/").replace(/~0/g, "~");
}

function sameValue(a: ParamValue | undefined, b: ParamValue | undefined): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** Nilai draf berbeda dari nilai induk (versi dasar)? */
export function isOverriddenFromParent(
  draft: Readonly<Record<string, ParamValue>>,
  parent: Readonly<Record<string, ParamValue>>,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(draft, key) && !sameValue(draft[key], parent[key]);
}

/** Reset satu kunci ke induk: hapus dari draf sehingga nilai versi dasar berlaku lagi. */
export function resetParamToParent(
  draft: Readonly<Record<string, ParamValue>>,
  key: string,
): Record<string, ParamValue> {
  const next: Record<string, ParamValue> = { ...draft };
  delete next[key];
  return next;
}

/** Kunci draf yang benar-benar berbeda dari induk (untuk ringkasan "n diubah"). */
export function changedKeys(
  draft: Readonly<Record<string, ParamValue>>,
  parent: Readonly<Record<string, ParamValue>>,
): string[] {
  return Object.keys(draft).filter((k) => isOverriddenFromParent(draft, parent, k));
}
