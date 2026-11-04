/**
 * S20: pengurai XML minimal tanpa dependensi untuk bagian OOXML (harness konformitas DATUM).
 *
 * Tidak memvalidasi, tidak mengenal namespace (nama simpul memakai awalan apa adanya, mis.
 * `w:p`), dan sengaja MENOLAK `<!DOCTYPE`: DOCX berasal dari luar (tak tepercaya) dan OOXML
 * tidak memakai DTD, jadi tidak ada ekspansi entitas selain lima entitas bawaan dan rujukan angka.
 * Iteratif (tanpa rekursi) agar dokumen 3+ MB dan pohon dalam tidak menghabiskan stack.
 */

export interface XmlText {
  readonly type: "text";
  readonly value: string;
}

export interface XmlElement {
  readonly type: "el";
  readonly name: string;
  readonly attrs: Readonly<Record<string, string>>;
  readonly children: XmlNode[];
  parent: XmlElement | null;
}

export type XmlNode = XmlElement | XmlText;

export class XmlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XmlParseError";
  }
}

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function decodeEntities(s: string): string {
  if (s.indexOf("&") < 0) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, ent: string) => {
    if (ent[0] === "#") {
      const code = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[ent] ?? m;
  });
}

// Pola lama `/([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g` kuadratik (L39-5): saat gagal ia mencoba
// ulang dari setiap offset di dalam satu deret karakter-nama, padahal ekornya sama. Pemindai ini
// memberi hasil identik: kegagalan dari offset mana pun dalam deret yang sama hanya bergantung
// pada akhir deret, jadi cukup melompat ke akhir deret. Regex lengket (`y`) hanya dipakai pada
// potongan yang tidak bisa backtrack lintas-offset, sehingga total waktu linear terhadap `src`.
const NAME_RE = /[^\s=/>]+/y;
const EQ_RE = /\s*=\s*/y;

function parseAttrs(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const n = src.length;
  let i = 0;
  while (i < n) {
    NAME_RE.lastIndex = i;
    const nm = NAME_RE.exec(src);
    if (nm === null) {
      i++;
      continue;
    }
    const nameEnd = i + nm[0].length;
    EQ_RE.lastIndex = nameEnd;
    const eq = EQ_RE.exec(src);
    if (eq !== null) {
      const open = nameEnd + eq[0].length;
      const quote = src[open];
      if (quote === '"' || quote === "'") {
        const close = src.indexOf(quote, open + 1);
        if (close >= 0) {
          out[nm[0]] = decodeEntities(src.slice(open + 1, close));
          i = close + 1;
          continue;
        }
      }
    }
    i = nameEnd;
  }
  return out;
}

/** Mengurai satu dokumen XML dan mengembalikan elemen akarnya. */
export function parseXml(xml: string, label = "xml"): XmlElement {
  const root: XmlElement = { type: "el", name: "#document", attrs: {}, children: [], parent: null };
  let cur: XmlElement = root;
  let i = 0;
  const n = xml.length;
  while (i < n) {
    const lt = xml.indexOf("<", i);
    if (lt < 0) {
      pushText(cur, xml.slice(i));
      break;
    }
    if (lt > i) pushText(cur, xml.slice(i, lt));
    if (xml.startsWith("<!--", lt)) {
      const end = xml.indexOf("-->", lt + 4);
      if (end < 0) throw new XmlParseError(`${label}: komentar tidak ditutup`);
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", lt)) {
      const end = xml.indexOf("]]>", lt + 9);
      if (end < 0) throw new XmlParseError(`${label}: CDATA tidak ditutup`);
      cur.children.push({ type: "text", value: xml.slice(lt + 9, end) });
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<!DOCTYPE", lt) || xml.startsWith("<!doctype", lt)) {
      throw new XmlParseError(`${label}: DOCTYPE ditolak (DOCX tak tepercaya)`);
    }
    if (xml.startsWith("<?", lt)) {
      const end = xml.indexOf("?>", lt + 2);
      if (end < 0) throw new XmlParseError(`${label}: instruksi pemrosesan tidak ditutup`);
      i = end + 2;
      continue;
    }
    const gt = findTagEnd(xml, lt + 1);
    if (gt < 0) throw new XmlParseError(`${label}: tag tidak ditutup pada offset ${lt}`);
    if (xml[lt + 1] === "/") {
      const name = xml.slice(lt + 2, gt).trim();
      if (cur.name !== name) throw new XmlParseError(`${label}: tag penutup </${name}> tidak cocok dengan <${cur.name}>`);
      cur = cur.parent ?? root;
      i = gt + 1;
      continue;
    }
    const selfClose = xml[gt - 1] === "/";
    const inner = xml.slice(lt + 1, selfClose ? gt - 1 : gt);
    const sp = inner.search(/[\s]/);
    const name = sp < 0 ? inner : inner.slice(0, sp);
    const el: XmlElement = { type: "el", name, attrs: sp < 0 ? {} : parseAttrs(inner.slice(sp)), children: [], parent: cur };
    cur.children.push(el);
    if (!selfClose) cur = el;
    i = gt + 1;
  }
  if (cur !== root) throw new XmlParseError(`${label}: elemen <${cur.name}> tidak ditutup`);
  const top = root.children.find((c): c is XmlElement => c.type === "el");
  if (!top) throw new XmlParseError(`${label}: tidak ada elemen akar`);
  top.parent = null;
  return top;
}

function findTagEnd(xml: string, from: number): number {
  let q: string | null = null;
  for (let j = from; j < xml.length; j++) {
    const c = xml[j];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === ">") {
      return j;
    }
  }
  return -1;
}

function pushText(el: XmlElement, raw: string): void {
  if (raw.length === 0) return;
  el.children.push({ type: "text", value: decodeEntities(raw) });
}

// ── Navigasi ─────────────────────────────────────────────────────────────

export function isEl(n: XmlNode | undefined | null): n is XmlElement {
  return !!n && n.type === "el";
}

/** Anak langsung (opsional difilter nama). */
export function children(el: XmlElement, name?: string): XmlElement[] {
  const out: XmlElement[] = [];
  for (const c of el.children) if (c.type === "el" && (name === undefined || c.name === name)) out.push(c);
  return out;
}

export function child(el: XmlElement | undefined, name: string): XmlElement | undefined {
  if (!el) return undefined;
  for (const c of el.children) if (c.type === "el" && c.name === name) return c;
  return undefined;
}

/** Jalur anak bertingkat, mis. `childPath(sectPr, "w:pgSz")`. */
export function childPath(el: XmlElement | undefined, ...names: string[]): XmlElement | undefined {
  let cur = el;
  for (const nm of names) cur = child(cur, nm);
  return cur;
}

export interface DescendOptions {
  /** Nama elemen yang tidak dimasuki (isinya dilewati), mis. `w:txbxContent`. */
  readonly skip?: ReadonlySet<string>;
}

/** Keturunan dalam urutan dokumen (pre-order), tidak termasuk `el` sendiri. */
export function descendants(el: XmlElement, name?: string | ReadonlySet<string>, opts: DescendOptions = {}): XmlElement[] {
  const out: XmlElement[] = [];
  const match = typeof name === "string" ? (x: string) => x === name : name ? (x: string) => name.has(x) : () => true;
  const stack: XmlNode[] = [];
  for (let k = el.children.length - 1; k >= 0; k--) stack.push(el.children[k]);
  while (stack.length) {
    const nd = stack.pop()!;
    if (nd.type !== "el") continue;
    if (match(nd.name)) out.push(nd);
    if (opts.skip?.has(nd.name)) continue;
    for (let k = nd.children.length - 1; k >= 0; k--) stack.push(nd.children[k]);
  }
  return out;
}

export function attr(el: XmlElement | undefined, name: string): string | undefined {
  return el ? el.attrs[name] : undefined;
}

export function attrNum(el: XmlElement | undefined, name: string): number | undefined {
  const v = attr(el, name);
  if (v === undefined || v.trim() === "") return undefined;
  const x = Number(v);
  return Number.isFinite(x) ? x : undefined;
}

/** Leluhur terdekat bernama `name`. */
export function ancestor(el: XmlElement, name: string): XmlElement | undefined {
  let cur = el.parent;
  while (cur) {
    if (cur.name === name) return cur;
    cur = cur.parent;
  }
  return undefined;
}

/** Semua teks mentah di bawah elemen (tanpa semantik OOXML). */
export function rawText(el: XmlElement): string {
  let s = "";
  const stack: XmlNode[] = [el];
  while (stack.length) {
    const nd = stack.pop()!;
    if (nd.type === "text") s += nd.value;
    else for (let k = nd.children.length - 1; k >= 0; k--) stack.push(nd.children[k]);
  }
  return s;
}
