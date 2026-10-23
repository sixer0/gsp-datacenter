/*
 * Pembangkit contoh minimal dari JSON Schema registri (S100).
 *
 * Skema diunduh dari `/api/studio/registry?kind=schema&schemaId=...` (R03).
 * Pembangkit menelusuri hanya properti `required`, mengikuti `$ref` absolut
 * (`<$id>#/$defs/X`) dan lokal, memilih cabang pertama `oneOf`/`anyOf`
 * (atau cabang berdiskriminator yang diminta petunjuk), menerapkan
 * `if/then/else` sederhana (const), dan mengisi larik wajib dengan satu item.
 * Nilai string memakai petunjuk per nama medan, lalu kandidat yang diuji
 * terhadap `pattern` skema. Hasilnya titik awal yang diperiksa ulang lewat
 * tombol Validasi, bukan jaminan lolos semua aturan isi.
 */

export type JsonSchemaDoc = Record<string, unknown>;
type Sch = Record<string, unknown> | boolean;

export interface ExampleHints {
  /** Nilai string per nama medan (dipakai bila tipe string dan cocok pola). */
  strings: Record<string, string>;
  /** Nilai angka per nama medan. */
  numbers: Record<string, number>;
  /** Nilai `enum` pilihan per nama medan (dipakai bila ada di enum). */
  enums: Record<string, unknown>;
  /** Nilai diskriminator cabang pilihan per nama properti diskriminator. */
  discriminators: Record<string, string>;
}

const MAX_DEPTH = 24;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function decodeToken(t: string): string {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}

interface Resolved {
  schema: Sch;
  base: string;
}

class Walker {
  constructor(
    private readonly docs: Readonly<Record<string, JsonSchemaDoc>>,
    private readonly hints: ExampleHints,
  ) {}

  private resolve(ref: string, base: string): Resolved {
    const hash = ref.indexOf("#");
    const url = hash === -1 ? ref : ref.slice(0, hash);
    const frag = hash === -1 ? "" : ref.slice(hash + 1);
    const docId = url || base;
    const doc = this.docs[docId];
    if (!doc) throw new Error(`Skema rujukan tidak dimuat: ${docId}`);
    let cur: unknown = doc;
    for (const raw of frag.split("/").filter(Boolean)) {
      if (!isObj(cur)) throw new Error(`Rujukan skema tidak sah: ${ref}`);
      cur = cur[decodeToken(raw)];
    }
    if (!isObj(cur) && typeof cur !== "boolean") throw new Error(`Rujukan skema tidak ditemukan: ${ref}`);
    return { schema: cur, base: docId };
  }

  private deref(r: Resolved): Resolved {
    let cur = r;
    for (let guard = 0; guard < 32 && isObj(cur.schema) && typeof cur.schema.$ref === "string"; guard++) {
      const { $ref, ...rest } = cur.schema;
      const target = this.resolve($ref as string, cur.base);
      if (Object.keys(rest).length === 0 || !isObj(target.schema)) {
        cur = target;
      } else {
        // $ref dengan saudara: gabung dangkal (saudara menimpa).
        cur = { schema: { ...target.schema, ...rest }, base: target.base };
      }
    }
    return cur;
  }

  /** Pilih cabang oneOf/anyOf: diskriminator yang diminta petunjuk, selain itu cabang pertama. */
  private pickBranch(s: Record<string, unknown>, base: string): Resolved | null {
    const list = (Array.isArray(s.oneOf) ? s.oneOf : Array.isArray(s.anyOf) ? s.anyOf : null) as Sch[] | null;
    if (!list || list.length === 0) return null;
    const disc = isObj(s.discriminator) && typeof s.discriminator.propertyName === "string" ? s.discriminator.propertyName : null;
    const want = disc ? this.hints.discriminators[disc] : undefined;
    if (disc && want !== undefined) {
      for (const b of list) {
        const r = this.deref({ schema: b, base });
        const props = isObj(r.schema) && isObj(r.schema.properties) ? r.schema.properties : null;
        const p = props && isObj(props[disc]) ? props[disc] : null;
        if (p && (p.const === want || (Array.isArray(p.enum) && p.enum.includes(want)))) return r;
      }
    }
    return this.deref({ schema: list[0], base });
  }

  /** Ratakan skema objek: properti dan required dari allOf, $ref, cabang terpilih. */
  private flatten(r: Resolved, depth: number): { props: Record<string, Resolved>; required: string[]; conds: Resolved[] } {
    const out = { props: {} as Record<string, Resolved>, required: [] as string[], conds: [] as Resolved[] };
    const d = this.deref(r);
    if (!isObj(d.schema) || depth > MAX_DEPTH) return out;
    const s = d.schema;
    if (isObj(s.properties)) {
      for (const [k, v] of Object.entries(s.properties)) {
        // `true` (penanda strictRequired di cabang xor) tidak menimpa definisi nyata.
        if (v === true && out.props[k]) continue;
        out.props[k] = { schema: v as Sch, base: d.base };
      }
    }
    if (Array.isArray(s.required)) out.required.push(...(s.required as string[]));
    if (s.if !== undefined) out.conds.push(d);
    const parts: Resolved[] = [];
    if (Array.isArray(s.allOf)) for (const a of s.allOf as Sch[]) parts.push({ schema: a, base: d.base });
    const branch = this.pickBranch(s, d.base);
    if (branch) parts.push(branch);
    for (const p of parts) {
      const f = this.flatten(p, depth + 1);
      for (const [k, v] of Object.entries(f.props)) {
        if (v.schema === true && out.props[k]) continue;
        out.props[k] = v;
      }
      out.required.push(...f.required);
      out.conds.push(...f.conds);
    }
    return out;
  }

  private typeOf(s: Record<string, unknown>): string | null {
    if (typeof s.type === "string") return s.type;
    if (Array.isArray(s.type) && s.type.length > 0) return String(s.type[0]);
    if (s.properties || s.required || s.oneOf || s.anyOf || s.allOf) return "object";
    if (s.items) return "array";
    return null;
  }

  private str(name: string, s: Record<string, unknown>): string {
    const pattern = typeof s.pattern === "string" ? s.pattern : null;
    const min = typeof s.minLength === "number" ? s.minLength : 0;
    const max = typeof s.maxLength === "number" ? s.maxLength : Infinity;
    const ok = (v: string) => {
      if (v.length < min || v.length > max) return false;
      if (!pattern) return true;
      try {
        return new RegExp(pattern, "u").test(v);
      } catch {
        return false;
      }
    };
    const today = new Date().toISOString().slice(0, 10);
    const candidates = [
      this.hints.strings[name],
      "Contoh",
      "contoh",
      "A",
      "KT",
      "1.1",
      "x1",
      today,
      "000000",
      "0".repeat(64),
      `${today}_contoh`,
    ].filter((v): v is string => typeof v === "string");
    for (const c of candidates) if (ok(c)) return c;
    return min > 0 ? "x".repeat(min) : "";
  }

  private num(name: string, s: Record<string, unknown>, integer: boolean): number {
    const hint = this.hints.numbers[name];
    const min = typeof s.minimum === "number" ? s.minimum : typeof s.exclusiveMinimum === "number" ? s.exclusiveMinimum + 1 : 0;
    const max = typeof s.maximum === "number" ? s.maximum : Infinity;
    if (typeof hint === "number" && hint >= min && hint <= max && (!integer || Number.isInteger(hint))) return hint;
    return integer ? Math.ceil(min) : min;
  }

  gen(r: Resolved, name: string, depth: number): unknown {
    const d = this.deref(r);
    const s = d.schema;
    if (!isObj(s)) return null;
    if ("const" in s) return s.const;
    if (Array.isArray(s.enum) && s.enum.length > 0) {
      const want = this.hints.enums[name];
      return want !== undefined && s.enum.includes(want) ? want : s.enum[0];
    }
    if (depth > MAX_DEPTH) return null;
    const type = this.typeOf(s);
    if (type === "object") return this.genObject(d, depth);
    if (type === "array") {
      const min = typeof s.minItems === "number" ? s.minItems : 0;
      const n = Math.max(min, depth < 14 ? 1 : 0);
      const items: unknown[] = [];
      for (let i = 0; i < n; i++) items.push(this.gen({ schema: (s.items ?? {}) as Sch, base: d.base }, name, depth + 1));
      return items;
    }
    if (type === "string") return this.str(name, s);
    if (type === "integer") return this.num(name, s, true);
    if (type === "number") return this.num(name, s, false);
    if (type === "boolean") return false;
    if (type === "null") return null;
    // Tanpa tipe (mis. `true` di cabang xor): pakai petunjuk string.
    return this.hints.strings[name] ?? "";
  }

  private genObject(r: Resolved, depth: number): Record<string, unknown> {
    const f = this.flatten(r, depth);
    const out: Record<string, unknown> = {};
    const fill = (keys: string[]) => {
      for (const k of keys) {
        if (k in out) continue;
        const p = f.props[k] ?? { schema: true, base: r.base };
        out[k] = this.gen(p, k, depth + 1);
      }
    };
    fill([...new Set(f.required)]);
    // if/then/else berbasis const (mis. chart: kind != composite -> data wajib).
    for (const c of f.conds) {
      if (!isObj(c.schema)) continue;
      const cond = this.deref({ schema: c.schema.if as Sch, base: c.base }).schema;
      let match = isObj(cond);
      if (isObj(cond) && isObj(cond.properties)) {
        for (const [k, v] of Object.entries(cond.properties)) {
          if (isObj(v) && "const" in v && out[k] !== v.const) match = false;
        }
      }
      const next = this.deref({ schema: (match ? c.schema.then : c.schema.else) as Sch, base: c.base }).schema;
      if (isObj(next) && Array.isArray(next.required)) fill(next.required as string[]);
    }
    return out;
  }
}

/** Bangkitkan contoh minimal untuk skema `$id` utama dengan semua skema rujukan termuat. */
export function generateExample(
  rootId: string,
  docs: Readonly<Record<string, JsonSchemaDoc>>,
  hints: ExampleHints,
): unknown {
  const w = new Walker(docs, hints);
  const root = docs[rootId];
  if (!root) throw new Error(`Skema utama tidak dimuat: ${rootId}`);
  return w.gen({ schema: root, base: rootId }, "", 0);
}

/** Kumpulkan URL `$ref` eksternal (tanpa fragmen) dalam satu dokumen skema. */
export function externalRefs(doc: JsonSchemaDoc): string[] {
  const own = typeof doc.$id === "string" ? doc.$id : "";
  const found = new Set<string>();
  const visit = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(visit);
    if (!isObj(v)) return;
    for (const [k, x] of Object.entries(v)) {
      if (k === "$ref" && typeof x === "string") {
        const url = x.split("#")[0];
        if (url && url !== own) found.add(url);
      } else visit(x);
    }
  };
  visit(doc);
  return [...found];
}
