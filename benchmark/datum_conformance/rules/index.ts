/**
 * S20: indeks aturan konformitas DATUM, terkabel ke 4 modul (stub) milik S21-S24.
 *
 * Satu-satunya penulis berkas ini adalah S20. Modul hanya mengisi `rules` miliknya sendiri;
 * `buildRuleIndex` menjaga agar setiap aturan = satu kode katalog, sekali, di modul pemiliknya,
 * dengan metadata yang sama persis dengan `catalog.ts`.
 */
import { CATALOG_BY_ID, COVERAGE_ONLY_CODES, DATUM_CATALOG, type CatalogEntry } from "../catalog";
import { rules as clashRules } from "../clash";
import { rules as language } from "./language";
import { rules as structureA } from "./structure_a";
import { rules as structureB } from "./structure_b";
import type { ModuleId, Rule } from "./types";

export const RULE_MODULES: Readonly<Record<ModuleId, readonly Rule[]>> = {
  structure_a: structureA,
  structure_b: structureB,
  language,
  clash: clashRules,
};

export class RuleIndexError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`indeks aturan tidak sah:\n- ${problems.join("\n- ")}`);
    this.name = "RuleIndexError";
  }
}

export interface RuleIndex {
  /** Aturan terdaftar, dalam urutan katalog. */
  readonly rules: readonly Rule[];
  readonly byId: ReadonlyMap<string, Rule>;
  readonly implemented: ReadonlySet<string>;
  readonly catalog: readonly CatalogEntry[];
}

function sameApplicability(a: CatalogEntry["applicability"], b: CatalogEntry["applicability"]): boolean {
  const eq = (x: readonly string[], y: readonly string[]) => x.length === y.length && x.every((v, i) => v === y[i]);
  const types = a.types === "all" || b.types === "all" ? a.types === b.types : eq(a.types, b.types);
  return eq(a.tiers, b.tiers) && eq(a.languages, b.languages) && types;
}

export function buildRuleIndex(
  modules: Readonly<Record<ModuleId, readonly Rule[]>> = RULE_MODULES,
  catalog: readonly CatalogEntry[] = DATUM_CATALOG,
): RuleIndex {
  const byCat = catalog === DATUM_CATALOG ? CATALOG_BY_ID : new Map(catalog.map((c) => [c.id, c]));
  const coverage = new Set(COVERAGE_ONLY_CODES);
  const problems: string[] = [];
  const byId = new Map<string, Rule>();
  for (const [mod, list] of Object.entries(modules) as [ModuleId, readonly Rule[]][]) {
    for (const r of list) {
      if (byId.has(r.id)) {
        problems.push(`${r.id}: terdaftar ganda (modul ${mod})`);
        continue;
      }
      if (coverage.has(r.id)) {
        problems.push(`${r.id}: butir cakupan-saja (research/32 §14), bukan aturan terukur`);
        continue;
      }
      const c = byCat.get(r.id);
      if (!c) {
        problems.push(`${r.id}: kode tidak ada di katalog (research/32)`);
        continue;
      }
      if (c.module !== mod) problems.push(`${r.id}: didaftarkan di modul ${mod}, pemilik katalog = modul ${c.module}`);
      if (r.module !== c.module) problems.push(`${r.id}: metadata module ${r.module} != katalog ${c.module}`);
      if (r.critical !== c.critical) problems.push(`${r.id}: metadata critical ${r.critical} != katalog ${c.critical}`);
      if (r.kind !== c.kind) problems.push(`${r.id}: metadata kind ${r.kind} != katalog ${c.kind}`);
      if (r.family !== c.family) problems.push(`${r.id}: metadata family ${r.family} != katalog ${c.family}`);
      if (r.citation !== c.citation) problems.push(`${r.id}: metadata citation menyimpang dari katalog (pakai defineRule)`);
      if (!sameApplicability(r.applicability, c.applicability)) problems.push(`${r.id}: metadata applicability menyimpang dari katalog`);
      if (typeof r.check !== "function") problems.push(`${r.id}: check bukan fungsi`);
      byId.set(r.id, r);
    }
  }
  if (problems.length) throw new RuleIndexError(problems);
  const rules = catalog.filter((c) => byId.has(c.id)).map((c) => byId.get(c.id)!);
  return { rules, byId, implemented: new Set(byId.keys()), catalog };
}

let cached: RuleIndex | undefined;

/** Indeks bawaan dari 4 modul terpasang (dibangun sekali). */
export function defaultRuleIndex(): RuleIndex {
  cached ??= buildRuleIndex();
  return cached;
}
