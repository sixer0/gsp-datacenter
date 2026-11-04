/**
 * S20: pembaca DOCX harness konformitas DATUM (R0, `research/32` §0.4), memakai `fflate`.
 *
 * Membuka paket sekali, hanya mendekompresi bagian XML/rels dan SVG media (gambar raster dan
 * fon tidak dibaca, cukup nama dan ukurannya), dengan batas ukuran per bagian dan total karena
 * DOCX yang dinilai berasal dari luar harness. Bagian diurai malas dan di-cache.
 *
 * API ini adalah kontrak untuk modul aturan S21-S23 (lihat `rules/types.ts`).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { strFromU8, unzipSync, type UnzipFileInfo } from "fflate";
import { ancestor, attr, attrNum, child, childPath, children, descendants, parseXml, type XmlElement } from "./xml";

export class DocxReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocxReadError";
  }
}

export interface DocxReadOptions {
  readonly path?: string;
  /** Batas ukuran tak terkompresi per bagian yang didekompresi (bawaan 64 MiB). */
  readonly maxPartBytes?: number;
  /** Batas total tak terkompresi bagian yang didekompresi (bawaan 256 MiB). */
  readonly maxTotalBytes?: number;
  /** Batas jumlah entri ZIP (bawaan 20000). */
  readonly maxEntries?: number;
}

export interface PartEntry {
  readonly name: string;
  readonly originalSize: number;
  readonly extracted: boolean;
}

export interface Relationship {
  readonly id: string;
  readonly type: string;
  readonly target: string;
  /** Nama bagian paket yang dituju (mis. `word/header1.xml`); undefined untuk target eksternal. */
  readonly part?: string;
  readonly external: boolean;
}

export type HfType = "default" | "first" | "even";

export interface PageMargins {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly header?: number;
  readonly footer?: number;
  readonly gutter?: number;
}

export interface Section {
  readonly index: number;
  /** Elemen blok seksi (w:p, w:tbl; isi w:sdt blok diratakan). Paragraf pembawa sectPr yang kosong tidak ikut. */
  readonly blocks: readonly XmlElement[];
  readonly sectPr: XmlElement | undefined;
  readonly pgSz: { readonly w?: number; readonly h?: number; readonly orient: "portrait" | "landscape" };
  readonly pgMar: PageMargins;
  readonly titlePg: boolean;
  readonly pgNumStart?: number;
  /** Bagian header/footer efektif per jenis, sesudah pewarisan dari seksi sebelumnya. */
  readonly headers: Partial<Record<HfType, string>>;
  readonly footers: Partial<Record<HfType, string>>;
  /** true bila rujukan default diwarisi (tidak ditulis di sectPr seksi ini). */
  readonly inherited: { readonly header: boolean; readonly footer: boolean };
}

export interface FieldInstruction {
  readonly kind: "simple" | "complex";
  /** Instruksi dengan spasi ujung dipangkas, mis. `PAGE`, `TOC \o "1-2" \h \z \u`. */
  readonly instr: string;
  /** Elemen pembawa (w:fldSimple atau run w:fldChar begin). */
  readonly node: XmlElement;
}

export interface RunFonts {
  readonly ascii?: string;
  readonly hAnsi?: string;
  readonly cs?: string;
  readonly eastAsia?: string;
}

export interface RunProps {
  readonly fonts: RunFonts;
  /** Ukuran dalam setengah poin (`w:sz`). */
  readonly sz?: number;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly caps: boolean;
  /** Hex kapital tanpa `#`, atau `auto`. */
  readonly color?: string;
  /** Spasi huruf dalam twip (`w:spacing` rPr). */
  readonly spacing?: number;
  readonly rStyle?: string;
}

export interface ParaProps {
  readonly styleId?: string;
  readonly outlineLvl?: number;
  readonly jc?: string;
  readonly indLeft?: number;
  readonly spacingLine?: number;
  readonly lineRule?: string;
}

export interface TextOptions {
  /** Teks tampak: run ber-caps efektif dikapitalkan (R0 "Teks tampak"). */
  readonly visible?: boolean;
}

const DEFAULT_MAX_PART = 64 * 1024 * 1024;
const DEFAULT_MAX_TOTAL = 256 * 1024 * 1024;
const DEFAULT_MAX_ENTRIES = 20000;
const SKIP_NESTED = new Set(["w:txbxContent"]);
const HF_TYPES: readonly HfType[] = ["default", "first", "even"];
const REL_HEADER = "/header";
const REL_FOOTER = "/footer";

function shouldExtract(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".xml") || lower.endsWith(".rels") || (lower.startsWith("word/media/") && lower.endsWith(".svg"));
}

/** Menormalkan target relasi relatif terhadap folder bagian sumber. */
export function resolvePartTarget(sourcePart: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const baseDir = sourcePart.includes("/") ? sourcePart.slice(0, sourcePart.lastIndexOf("/")) : "";
  const segs = baseDir ? baseDir.split("/") : [];
  for (const s of target.split("/")) {
    if (s === "..") segs.pop();
    else if (s !== "." && s !== "") segs.push(s);
  }
  return segs.join("/");
}

function onOff(el: XmlElement | undefined): boolean | undefined {
  if (!el) return undefined;
  const v = attr(el, "w:val");
  if (v === undefined) return true;
  return !(v === "0" || v === "false" || v === "off");
}

function naturalPartOrder(a: string, b: string): number {
  const na = Number((a.match(/(\d+)\.xml$/) ?? [])[1] ?? 0);
  const nb = Number((b.match(/(\d+)\.xml$/) ?? [])[1] ?? 0);
  return na - nb || a.localeCompare(b);
}

export class DocxDocument {
  readonly path?: string;
  readonly sha256: string;
  readonly byteLength: number;
  private readonly entries: PartEntry[];
  private readonly raw: Map<string, Uint8Array>;
  private readonly parsed = new Map<string, XmlElement>();
  private readonly relsCache = new Map<string, Map<string, Relationship>>();
  private sectionsCache?: Section[];
  private styleMap?: Map<string, XmlElement>;
  private readonly runPropsCache = new WeakMap<XmlElement, RunProps>();

  private constructor(bytes: Uint8Array, opts: DocxReadOptions) {
    this.path = opts.path;
    this.byteLength = bytes.length;
    this.sha256 = createHash("sha256").update(bytes).digest("hex");
    const maxPart = opts.maxPartBytes ?? DEFAULT_MAX_PART;
    const maxTotal = opts.maxTotalBytes ?? DEFAULT_MAX_TOTAL;
    const maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const entries: PartEntry[] = [];
    let total = 0;
    let unz: Record<string, Uint8Array>;
    try {
      unz = unzipSync(bytes, {
        filter: (f: UnzipFileInfo) => {
          if (entries.length >= maxEntries) throw new DocxReadError(`paket melebihi batas ${maxEntries} entri`);
          const ex = shouldExtract(f.name);
          if (ex) {
            if (f.originalSize > maxPart) throw new DocxReadError(`bagian ${f.name} (${f.originalSize} B) melebihi batas ${maxPart} B`);
            total += f.originalSize;
            if (total > maxTotal) throw new DocxReadError(`total bagian XML melebihi batas ${maxTotal} B`);
          }
          entries.push({ name: f.name, originalSize: f.originalSize, extracted: ex });
          return ex;
        },
      });
    } catch (e) {
      if (e instanceof DocxReadError) throw e;
      throw new DocxReadError(`bukan paket ZIP/DOCX yang terbaca: ${(e as Error).message}`);
    }
    for (const [name, data] of Object.entries(unz)) {
      if (data.length > maxPart) throw new DocxReadError(`bagian ${name} melebihi batas ${maxPart} B setelah dekompresi`);
    }
    if (!unz["word/document.xml"]) throw new DocxReadError("paket tidak memuat word/document.xml");
    this.entries = entries;
    this.raw = new Map(Object.entries(unz));
  }

  static fromBytes(bytes: Uint8Array, opts: DocxReadOptions = {}): DocxDocument {
    return new DocxDocument(bytes, opts);
  }

  static fromFile(file: string, opts: Omit<DocxReadOptions, "path"> = {}): DocxDocument {
    let bytes: Uint8Array;
    try {
      bytes = readFileSync(file);
    } catch (e) {
      throw new DocxReadError(`tidak dapat membaca ${file}: ${(e as Error).message}`);
    }
    return new DocxDocument(bytes, { ...opts, path: file });
  }

  // ── Bagian ───────────────────────────────────────────────────────────

  /** Semua entri ZIP (termasuk yang tidak didekompresi: media raster, fon). */
  partEntries(): readonly PartEntry[] {
    return this.entries;
  }

  partNames(): string[] {
    return this.entries.map((e) => e.name);
  }

  hasPart(name: string): boolean {
    return this.entries.some((e) => e.name === name);
  }

  partXml(name: string): string | undefined {
    const b = this.raw.get(name);
    return b ? strFromU8(b) : undefined;
  }

  /** Elemen akar bagian XML (diurai sekali). */
  part(name: string): XmlElement | undefined {
    const hit = this.parsed.get(name);
    if (hit) return hit;
    const xml = this.partXml(name);
    if (xml === undefined) return undefined;
    const root = parseXml(xml, name);
    this.parsed.set(name, root);
    return root;
  }

  get document(): XmlElement {
    return this.part("word/document.xml")!;
  }

  get body(): XmlElement {
    const b = child(this.document, "w:body");
    if (!b) throw new DocxReadError("word/document.xml tanpa w:body");
    return b;
  }

  get styles(): XmlElement | undefined {
    return this.part("word/styles.xml");
  }

  get settings(): XmlElement | undefined {
    return this.part("word/settings.xml");
  }

  get numbering(): XmlElement | undefined {
    return this.part("word/numbering.xml");
  }

  get fontTable(): XmlElement | undefined {
    return this.part("word/fontTable.xml");
  }

  get theme(): XmlElement | undefined {
    return this.part("word/theme/theme1.xml");
  }

  headerParts(): string[] {
    return this.partNames().filter((n) => /^word\/header\d*\.xml$/.test(n)).sort(naturalPartOrder);
  }

  footerParts(): string[] {
    return this.partNames().filter((n) => /^word\/footer\d*\.xml$/.test(n)).sort(naturalPartOrder);
  }

  /** Relasi bagian, dari `<dir>/_rels/<file>.rels`. */
  rels(sourcePart = "word/document.xml"): Map<string, Relationship> {
    const hit = this.relsCache.get(sourcePart);
    if (hit) return hit;
    const slash = sourcePart.lastIndexOf("/");
    const relsName = `${sourcePart.slice(0, slash + 1)}_rels/${sourcePart.slice(slash + 1)}.rels`;
    const root = this.part(relsName);
    const out = new Map<string, Relationship>();
    if (root) {
      for (const r of children(root, "Relationship")) {
        const id = attr(r, "Id");
        const target = attr(r, "Target") ?? "";
        if (!id) continue;
        const external = attr(r, "TargetMode") === "External";
        out.set(id, {
          id,
          type: attr(r, "Type") ?? "",
          target,
          external,
          part: external ? undefined : resolvePartTarget(sourcePart, target),
        });
      }
    }
    this.relsCache.set(sourcePart, out);
    return out;
  }

  // ── Seksi ────────────────────────────────────────────────────────────

  sections(): Section[] {
    if (this.sectionsCache) return this.sectionsCache;
    const body = this.body;
    const rels = this.rels("word/document.xml");
    const flat: XmlElement[] = [];
    const pushBlocks = (el: XmlElement) => {
      for (const c of children(el)) {
        if (c.name === "w:sdt") {
          const content = child(c, "w:sdtContent");
          if (content) pushBlocks(content);
        } else if (c.name !== "w:sectPr") {
          flat.push(c);
        }
      }
    };
    pushBlocks(body);

    const groups: { blocks: XmlElement[]; sectPr?: XmlElement }[] = [];
    let curBlocks: XmlElement[] = [];
    for (const b of flat) {
      const sp = b.name === "w:p" ? childPath(b, "w:pPr", "w:sectPr") : undefined;
      if (sp) {
        // Paragraf pembawa sectPr yang tanpa run teks tidak dihitung sebagai blok isi.
        if (descendants(b, "w:r").length > 0) curBlocks.push(b);
        groups.push({ blocks: curBlocks, sectPr: sp });
        curBlocks = [];
      } else {
        curBlocks.push(b);
      }
    }
    groups.push({ blocks: curBlocks, sectPr: child(body, "w:sectPr") });

    const out: Section[] = [];
    let prevH: Partial<Record<HfType, string>> = {};
    let prevF: Partial<Record<HfType, string>> = {};
    groups.forEach((g, index) => {
      const sp = g.sectPr;
      const own = (tag: string, relSuffix: string): Partial<Record<HfType, string>> => {
        const m: Partial<Record<HfType, string>> = {};
        if (!sp) return m;
        for (const ref of children(sp, tag)) {
          const t = (attr(ref, "w:type") ?? "default") as HfType;
          const rel = rels.get(attr(ref, "r:id") ?? "");
          if (rel?.part && rel.type.endsWith(relSuffix) && HF_TYPES.includes(t)) m[t] = rel.part;
        }
        return m;
      };
      const ownH = own("w:headerReference", REL_HEADER);
      const ownF = own("w:footerReference", REL_FOOTER);
      const headers = { ...prevH, ...ownH };
      const footers = { ...prevF, ...ownF };
      prevH = headers;
      prevF = footers;
      const pgSzEl = child(sp, "w:pgSz");
      const pgMarEl = child(sp, "w:pgMar");
      out.push({
        index,
        blocks: g.blocks,
        sectPr: sp,
        pgSz: { w: attrNum(pgSzEl, "w:w"), h: attrNum(pgSzEl, "w:h"), orient: attr(pgSzEl, "w:orient") === "landscape" ? "landscape" : "portrait" },
        pgMar: {
          top: attrNum(pgMarEl, "w:top"),
          right: attrNum(pgMarEl, "w:right"),
          bottom: attrNum(pgMarEl, "w:bottom"),
          left: attrNum(pgMarEl, "w:left"),
          header: attrNum(pgMarEl, "w:header"),
          footer: attrNum(pgMarEl, "w:footer"),
          gutter: attrNum(pgMarEl, "w:gutter"),
        },
        titlePg: onOff(child(sp, "w:titlePg")) ?? false,
        pgNumStart: attrNum(child(sp, "w:pgNumType"), "w:start"),
        headers,
        footers,
        inherited: { header: ownH.default === undefined && headers.default !== undefined, footer: ownF.default === undefined && footers.default !== undefined },
      });
    });
    this.sectionsCache = out;
    return out;
  }

  // ── Paragraf, run, teks ──────────────────────────────────────────────

  /** Paragraf di bawah lingkup (elemen atau daftar blok), termasuk di sel tabel; isi kotak teks dilewati. */
  paragraphs(scope: XmlElement | readonly XmlElement[] = this.body): XmlElement[] {
    return this.collect(scope, "w:p");
  }

  /** Run milik paragraf (termasuk di w:hyperlink, w:fldSimple, w:sdtContent, w:ins/w:smartTag). */
  runs(paragraph: XmlElement): XmlElement[] {
    return descendants(paragraph, "w:r", { skip: SKIP_NESTED });
  }

  runText(run: XmlElement, opts: TextOptions = {}): string {
    let s = "";
    for (const c of children(run)) {
      if (c.name === "w:t") s += textOf(c);
      else if (c.name === "w:tab") s += "\t";
      else if (c.name === "w:br" || c.name === "w:cr") s += "\n";
      else if (c.name === "w:noBreakHyphen") s += "-";
    }
    return opts.visible && this.effectiveRunProps(run).caps ? s.toUpperCase() : s;
  }

  paragraphText(paragraph: XmlElement, opts: TextOptions = {}): string {
    let s = "";
    for (const r of this.runs(paragraph)) s += this.runText(r, opts);
    return s;
  }

  /** Teks gabungan lingkup: paragraf dipisah `\n`. */
  text(scope: XmlElement | readonly XmlElement[] = this.body, opts: TextOptions = {}): string {
    return this.paragraphs(scope)
      .map((p) => this.paragraphText(p, opts))
      .join("\n");
  }

  // ── Tabel ────────────────────────────────────────────────────────────

  tables(scope: XmlElement | readonly XmlElement[] = this.body): XmlElement[] {
    return this.collect(scope, "w:tbl");
  }

  tableRows(tbl: XmlElement): XmlElement[] {
    return children(tbl, "w:tr");
  }

  rowCells(tr: XmlElement): XmlElement[] {
    const out: XmlElement[] = [];
    for (const c of children(tr)) {
      if (c.name === "w:tc") out.push(c);
      else if (c.name === "w:sdt") out.push(...children(child(c, "w:sdtContent") ?? c, "w:tc"));
    }
    return out;
  }

  cellText(tc: XmlElement, opts: TextOptions = {}): string {
    return children(tc, "w:p")
      .map((p) => this.paragraphText(p, opts))
      .join("\n");
  }

  gridCols(tbl: XmlElement): number[] {
    return children(child(tbl, "w:tblGrid") ?? tbl, "w:gridCol").map((g) => attrNum(g, "w:w") ?? 0);
  }

  /** Tabel teratas (bukan bersarang) yang memuat elemen, bila ada. */
  enclosingTable(el: XmlElement): XmlElement | undefined {
    return ancestor(el, "w:tbl");
  }

  // ── Medan ────────────────────────────────────────────────────────────

  fieldInstructions(scope: XmlElement | readonly XmlElement[]): FieldInstruction[] {
    const out: FieldInstruction[] = [];
    const roots = Array.isArray(scope) ? (scope as readonly XmlElement[]) : [scope as XmlElement];
    for (const root of roots) {
      const nodes = [root, ...descendants(root, undefined, { skip: SKIP_NESTED })];
      let collecting: { node: XmlElement; parts: string[] } | null = null;
      for (const nd of nodes) {
        if (nd.name === "w:fldSimple") {
          out.push({ kind: "simple", instr: (attr(nd, "w:instr") ?? "").trim(), node: nd });
        } else if (nd.name === "w:fldChar") {
          const t = attr(nd, "w:fldCharType");
          if (t === "begin") collecting = { node: nd.parent ?? nd, parts: [] };
          else if ((t === "separate" || t === "end") && collecting) {
            out.push({ kind: "complex", instr: collecting.parts.join("").trim(), node: collecting.node });
            collecting = null;
          }
        } else if (nd.name === "w:instrText") {
          if (collecting) collecting.parts.push(textOf(nd));
          else out.push({ kind: "complex", instr: textOf(nd).trim(), node: nd.parent ?? nd });
        }
      }
    }
    return out;
  }

  // ── Format efektif ───────────────────────────────────────────────────

  styleById(id: string): XmlElement | undefined {
    if (!this.styleMap) {
      this.styleMap = new Map();
      const st = this.styles;
      if (st) for (const s of children(st, "w:style")) {
        const sid = attr(s, "w:styleId");
        if (sid) this.styleMap.set(sid, s);
      }
    }
    return this.styleMap.get(id);
  }

  /** Rantai gaya (gaya itu sendiri lalu basedOn), dengan pengaman siklus. */
  styleChain(id: string | undefined): XmlElement[] {
    const out: XmlElement[] = [];
    const seen = new Set<string>();
    let cur = id;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const s = this.styleById(cur);
      if (!s) break;
      out.push(s);
      cur = attr(child(s, "w:basedOn"), "w:val");
    }
    return out;
  }

  effectiveParaProps(paragraph: XmlElement): ParaProps {
    const pPr = child(paragraph, "w:pPr");
    const styleId = attr(child(pPr, "w:pStyle"), "w:val");
    const layers: (XmlElement | undefined)[] = [pPr, ...this.styleChain(styleId).map((s) => child(s, "w:pPr"))];
    layers.push(childPath(this.styles, "w:docDefaults", "w:pPrDefault", "w:pPr"));
    const first = (name: string, a: string): string | undefined => {
      for (const l of layers) {
        const v = attr(child(l, name), a);
        if (v !== undefined) return v;
      }
      return undefined;
    };
    const num = (v: string | undefined) => (v === undefined || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));
    return {
      styleId,
      outlineLvl: num(first("w:outlineLvl", "w:val")),
      jc: first("w:jc", "w:val"),
      indLeft: num(first("w:ind", "w:left") ?? first("w:ind", "w:start")),
      spacingLine: num(first("w:spacing", "w:line")),
      lineRule: first("w:spacing", "w:lineRule"),
    };
  }

  /** rPr langsung, lalu w:rStyle (+basedOn), lalu rPr gaya paragraf (+basedOn), lalu docDefaults. */
  effectiveRunProps(run: XmlElement): RunProps {
    const hit = this.runPropsCache.get(run);
    if (hit) return hit;
    const rPr = child(run, "w:rPr");
    const rStyle = attr(child(rPr, "w:rStyle"), "w:val");
    const para = ancestor(run, "w:p");
    const pStyle = para ? attr(childPath(para, "w:pPr", "w:pStyle"), "w:val") : undefined;
    const layers: (XmlElement | undefined)[] = [
      rPr,
      ...this.styleChain(rStyle).map((s) => child(s, "w:rPr")),
      ...this.styleChain(pStyle).map((s) => child(s, "w:rPr")),
      childPath(this.styles, "w:docDefaults", "w:rPrDefault", "w:rPr"),
    ];
    const firstEl = (name: string): XmlElement | undefined => {
      for (const l of layers) {
        const e = child(l, name);
        if (e) return e;
      }
      return undefined;
    };
    const firstAttr = (name: string, a: string): string | undefined => {
      for (const l of layers) {
        const v = attr(child(l, name), a);
        if (v !== undefined) return v;
      }
      return undefined;
    };
    const font = (a: "ascii" | "hAnsi" | "cs" | "eastAsia"): string | undefined => {
      const direct = firstAttr("w:rFonts", `w:${a}`);
      if (direct !== undefined) return direct;
      const themed = firstAttr("w:rFonts", `w:${a}Theme`);
      return themed ? this.themeFont(themed) : undefined;
    };
    const color = firstAttr("w:color", "w:val");
    const szV = firstAttr("w:sz", "w:val");
    const spV = firstAttr("w:spacing", "w:val");
    const props: RunProps = {
      fonts: { ascii: font("ascii"), hAnsi: font("hAnsi"), cs: font("cs"), eastAsia: font("eastAsia") },
      sz: szV !== undefined && Number.isFinite(Number(szV)) ? Number(szV) : undefined,
      bold: onOff(firstEl("w:b")) ?? false,
      italic: onOff(firstEl("w:i")) ?? false,
      caps: onOff(firstEl("w:caps")) ?? false,
      color: color === undefined ? undefined : color.toLowerCase() === "auto" ? "auto" : color.toUpperCase(),
      spacing: spV !== undefined && Number.isFinite(Number(spV)) ? Number(spV) : undefined,
      rStyle,
    };
    this.runPropsCache.set(run, props);
    return props;
  }

  /** Resolusi nama fon tema (`minorHAnsi`, `majorAscii`, ...) lewat theme1.xml. */
  themeFont(themeName: string): string | undefined {
    const th = this.theme;
    if (!th) return undefined;
    const scheme = descendants(th, "a:fontScheme")[0];
    if (!scheme) return undefined;
    const group = child(scheme, themeName.startsWith("major") ? "a:majorFont" : "a:minorFont");
    const slot = /EastAsia$/i.test(themeName) ? "a:ea" : /Bidi$/i.test(themeName) ? "a:cs" : "a:latin";
    return attr(child(group, slot), "typeface");
  }

  // ── Inventaris ───────────────────────────────────────────────────────

  /** Bagian teks R0: document.xml, header*, footer*. */
  textPartNames(): string[] {
    return ["word/document.xml", ...this.headerParts(), ...this.footerParts()];
  }

  /** Nama fon efektif semua run di bagian teks, ditambah rFonts di styles.xml. */
  fontsUsed(): Set<string> {
    const out = new Set<string>();
    for (const name of this.textPartNames()) {
      const root = this.part(name);
      if (!root) continue;
      for (const r of descendants(root, "w:r")) {
        const f = this.effectiveRunProps(r).fonts;
        for (const v of [f.ascii, f.hAnsi, f.cs, f.eastAsia]) if (v) out.add(v);
      }
    }
    const st = this.styles;
    if (st) for (const rf of descendants(st, "w:rFonts")) {
      for (const k of ["w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"]) {
        const v = attr(rf, k);
        if (v) out.add(v);
      }
    }
    return out;
  }

  /** Histogram ukuran efektif (setengah poin) run bertek di bagian teks. */
  sizesUsed(): Map<number, number> {
    const out = new Map<number, number>();
    for (const name of this.textPartNames()) {
      const root = this.part(name);
      if (!root) continue;
      for (const r of descendants(root, "w:r")) {
        if (!child(r, "w:t")) continue;
        const sz = this.effectiveRunProps(r).sz;
        if (sz !== undefined) out.set(sz, (out.get(sz) ?? 0) + 1);
      }
    }
    return out;
  }

  /** Byte bagian yang didekompresi (XML/rels/SVG); undefined untuk raster/fon. */
  partBytes(name: string): Uint8Array | undefined {
    return this.raw.get(name);
  }

  private collect(scope: XmlElement | readonly XmlElement[], name: string): XmlElement[] {
    const roots = Array.isArray(scope) ? (scope as readonly XmlElement[]) : [scope as XmlElement];
    const out: XmlElement[] = [];
    for (const r of roots) {
      if (r.name === name) out.push(r);
      out.push(...descendants(r, name, { skip: SKIP_NESTED }));
    }
    return out;
  }
}

function textOf(el: XmlElement): string {
  let s = "";
  for (const c of el.children) if (c.type === "text") s += c.value;
  return s;
}
