/**
 * Utilitas parameter untuk editor templat (S101, dipakai S58): pencarian kunci/
 * label, pengelompokan per bab manual lalu namespace, penanda kelas B/K/T, dan
 * reset ke induk. Fungsi murni atas `ParamDef[]` dari
 * GET /api/studio/registry?kind=params (lihat `fetchParamRegistry`).
 */
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";

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
  chapter?: string;
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
      (!opts.chapter || p.chapter === opts.chapter) &&
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

/** Urutan bab manual: "Bab 1-2" < "Bab 3" < ... < "Bab 16" < "Lampiran" < "Renderer" < lainnya. */
export function chapterRank(chapter: string): number {
  const m = /^Bab\s+(\d+)/.exec(chapter);
  if (m) return Number(m[1]);
  if (chapter === "Lampiran") return 1000;
  if (chapter === "Renderer") return 1001;
  return 1002;
}

export interface ParamNamespaceGroup {
  namespace: string;
  params: ParamDef[];
  counts: Record<ParamClass, number>;
}

export interface ParamChapterGroup {
  chapter: string;
  namespaces: ParamNamespaceGroup[];
  total: number;
  counts: Record<ParamClass, number>;
}

function emptyCounts(): Record<ParamClass, number> {
  return { B: 0, K: 0, T: 0 };
}

/**
 * Kelompokkan per bab manual (urut `chapterRank`), lalu per namespace (urut
 * kemunculan pertama di registri, mengikuti urutan katalog). Urutan parameter
 * di dalam namespace dipertahankan.
 */
export function groupParams(params: readonly ParamDef[]): ParamChapterGroup[] {
  const chapters = new Map<string, Map<string, ParamDef[]>>();
  for (const p of params) {
    let ns = chapters.get(p.chapter);
    if (!ns) chapters.set(p.chapter, (ns = new Map()));
    const list = ns.get(p.namespace);
    if (list) list.push(p);
    else ns.set(p.namespace, [p]);
  }
  const out: ParamChapterGroup[] = [];
  for (const [chapter, nsMap] of chapters) {
    const counts = emptyCounts();
    const namespaces: ParamNamespaceGroup[] = [];
    for (const [namespace, list] of nsMap) {
      const c = emptyCounts();
      for (const p of list) c[p.class] += 1;
      counts.B += c.B;
      counts.K += c.K;
      counts.T += c.T;
      namespaces.push({ namespace, params: list, counts: c });
    }
    out.push({ chapter, namespaces, total: counts.B + counts.K + counts.T, counts });
  }
  out.sort((a, b) => chapterRank(a.chapter) - chapterRank(b.chapter) || a.chapter.localeCompare(b.chapter));
  return out;
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
