/**
 * Renderer halaman pembungkus (S18, I07): cover, controlSheet, toc,
 * partDivider, signatureBlock, appendix (pembuka lampiran).
 *
 * Isi NormBlock (`block.content`) per kunci:
 *   cover / controlSheet -> FrontPage;  toc -> TocSpec;  partDivider -> PartSpec;
 *   signatureBlock -> SignatureBlock;   appendix -> Chapter (hanya pembuka:
 *   kicker, Datum Rule 128, judul; intro dan seksi dirender renderer
 *   chapter/section S16).
 * Renderer tidak menulis paragraf pemegang sectPr (K-12, KS-06): itu milik
 * perakit S20 yang menutup setiap unit.
 *
 * Urutan unsur mengikuti konvensi benchmark S93 (doc.json x.benchmark):
 * C5 PartSpec = body[] -> label -> title -> lede -> daftar bab;
 * C6 TocSpec = sealBand -> kicker -> title -> tabel entri -> note;
 * C7 SignatureBlock = baris peran, ruang tanda tangan, pemegang.
 */
import type {
  Chapter,
  Colophon,
  ControlBlock,
  ControlSheetData,
  CoverData,
  DeviceBlock,
  DocxBlockRenderer,
  DocxFragment,
  FrontItem,
  FrontPage,
  Inline,
  NormBlock,
  ParaFormat,
  PartSpec,
  RenderContext,
  SignatureBlock,
  StudioDocV1,
  TableBlock,
  TocEntry,
  TocSpec,
} from "../../../contract";
import { StudioEngineError } from "../../../contract/errors";
import { explicitCoverApparatus } from "../../front/apparatus";
import {
  WRAPPER_TEXT as L,
  appendixOpenerKickerText,
  chapterLabelText,
  colophonTexts,
  controlBlockRowsText,
  controlSheetBlockHeading,
  controlSheetKickerText,
  defaultPartLabelText,
  tocKickerText,
  type ControlSheetBlockKind,
} from "../../front/texts";
import { paraOf, pStr, roleFormat, type WrapperRole } from "./formats";
import {
  datumRuleParagraphXml,
  frontItemsXml,
  hasText,
  paraItem,
  pBool,
  pStrList,
  roleParagraphXml,
  sealBandTexts,
  signatureXml,
  spineText,
  spineXml,
  WrapperBuilder,
  type WrapperUnit,
} from "./render";
import { inlinePlain, inlineRuns, paragraphXml, runsXml, scaleCols, tableXml, textInline, type WRow } from "./xml";

// ── Pembantu ─────────────────────────────────────────────────────────────

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function contentOf<T>(block: NormBlock, key: string, guard: (v: Record<string, unknown>) => boolean): T {
  const c = block.content;
  if (!isObj(c) || !guard(c)) {
    throw new StudioEngineError("SCHEMA_INVALID", `isi blok pembungkus "${key}" tidak sesuai bentuk kontrak`, {
      blockId: block.blockId,
      type: block.type,
    });
  }
  return c as T;
}

function build(ctx: RenderContext, block: NormBlock, unit: WrapperUnit, fill: (b: WrapperBuilder) => void): DocxFragment {
  const b = new WrapperBuilder(ctx, block, unit);
  fill(b);
  return b.fragment();
}

function sealBandItem(b: WrapperBuilder): DeviceBlock | undefined {
  return pBool(b.params, "device.sealBand.enabled", true) ? { type: "device", device: "sealBand" } : undefined;
}

function rulePlaced(b: WrapperBuilder, where: "sampul" | "pembatas" | "atas judul bab"): boolean {
  return pBool(b.params, "device.datumRule.enabled", true) && pStrList(b.params, "device.datumRule.placements", ["atas judul bab", "sampul", "pembatas"]).includes(where);
}

function spinePlaced(b: WrapperBuilder, where: "margin luar sampul" | "pembatas"): boolean {
  return pBool(b.params, "device.spine.enabled", true) && pStrList(b.params, "device.spine.placements", ["margin luar sampul", "pembatas"]).includes(where);
}

// FIX-2 (F-055): teks bawaan pembungkus (tabel `L`) = satu sumber bersama HTML di `engine/front/texts.ts`.

/** Kunci bab/lampiran efektif (default posisi: 1..n, A..Z). */
function chapterKey(list: readonly Chapter[], ch: Chapter, appendix: boolean): string {
  if (ch.key) return ch.key;
  const i = list.indexOf(ch);
  return appendix ? String.fromCharCode(65 + Math.max(0, i)) : String(Math.max(0, i) + 1);
}

function findChapter(doc: StudioDocV1, key: string): { ch: Chapter; appendix: boolean } | undefined {
  const c = doc.chapters.find((x) => chapterKey(doc.chapters, x, false) === key);
  if (c) return { ch: c, appendix: false };
  const apps = doc.appendices ?? [];
  const a = apps.find((x) => chapterKey(apps, x, true) === key);
  return a ? { ch: a, appendix: true } : undefined;
}

function chapterLabel(b: WrapperBuilder, ch: Chapter, key: string, appendix: boolean): string {
  if (hasText(ch.kicker)) return inlinePlain(ch.kicker);
  return chapterLabelText(key, appendix, b.lang);
}

// ── cover ────────────────────────────────────────────────────────────────

/** Blok kendali dari meta + P4V-12 (medan kosong dilewati, pasangan berurutan); teks = sumber bersama HTML (FIX-2 O-3). */
export function autoControlBlock(b: WrapperBuilder): ControlBlock | undefined {
  const rows = controlBlockRowsText(b.ctx.snapshot.doc.meta, b.params, b.lang);
  return rows ? { type: "controlBlock", rows: rows.map((r) => [textInline(r[0]), textInline(r[1]), textInline(r[2]), textInline(r[3])]) } : undefined;
}

/** Kolofon dari P4V-13: entitas + NIB (kiri), cap terbit (kanan); teks = sumber bersama HTML (FIX-2 O-3). */
export function autoColophon(b: WrapperBuilder): Colophon {
  const c = colophonTexts(b.ctx.snapshot.doc.meta, b.params);
  return { type: "colophon", left: textInline(c.left), right: textInline(c.right) };
}

/**
 * Susun sampul mode auto menurut P4V-03 `cover.elementOrder`. `orderOverride`
 * (FIX-SERAH, D-295) = subset butir aparatus untuk sampul explicit.
 */
export function autoCoverItems(b: WrapperBuilder, data: CoverData | undefined, orderOverride?: readonly string[]): FrontItem[] {
  const meta = b.ctx.snapshot.doc.meta;
  const p = b.params;
  const order = orderOverride ?? pStrList(p, "cover.elementOrder", [
    "pita segel",
    "logo",
    "baris alamat di atas garis rambut",
    "ruang putih",
    "Datum Rule 166 mm",
    "kicker jenis dokumen",
    "judul",
    "standfirst",
    "baris cakupan",
    "blok kendali",
    "kolofon",
    "string punggung",
  ]);
  const items: FrontItem[] = [];
  const strInline = (s: string | undefined): Inline | undefined => (s && s.trim() !== "" ? textInline(s) : undefined);
  for (const el of order) {
    switch (el) {
      case "pita segel": {
        const s = sealBandItem(b);
        if (s) items.push(s);
        break;
      }
      case "logo":
        items.push({ type: "device", device: "logo" });
        break;
      case "baris alamat di atas garis rambut": {
        const addr = data?.addressLine ?? strInline(pStr(p, "cover.addressLine"));
        if (hasText(addr)) items.push(paraItem("addressLine", addr));
        items.push({ type: "device", device: "hairline" });
        break;
      }
      case "ruang putih":
        // Ruang putih sampul diwujudkan spasi sesudah garis rambut (K-03 after 800).
        break;
      case "Datum Rule 166 mm":
        if (rulePlaced(b, "sampul")) items.push({ type: "device", device: "datumRule" });
        break;
      case "kicker jenis dokumen": {
        const k = data?.kicker ?? strInline(pStr(p, "cover.kicker.text"));
        if (hasText(k)) items.push(paraItem("kicker", k));
        break;
      }
      case "judul": {
        const lines = data?.titleLines && data.titleLines.length > 0 ? data.titleLines : [textInline(meta.title)];
        for (const l of lines) items.push(paraItem("title", l));
        break;
      }
      case "standfirst":
        if (hasText(data?.standfirst)) items.push(paraItem("standfirst", data.standfirst));
        break;
      case "baris cakupan": {
        const s = data?.scopeLine ?? strInline(pStr(p, "cover.scopeLine"));
        if (hasText(s)) items.push(paraItem("scopeLine", s));
        break;
      }
      case "blok kendali": {
        const cb = data?.control ?? autoControlBlock(b);
        if (cb) items.push(cb);
        break;
      }
      case "kolofon":
        // K-10: spasi kosong sebelum kolofon (before 280, line 120 exact).
        items.push({ type: "spacer", format: { spacingBeforeTw: 280, spacingAfterTw: 0, lineTw: 120, lineRule: "exact" } });
        items.push(data?.colophon ?? autoColophon(b));
        break;
      case "string punggung":
        if (spinePlaced(b, "margin luar sampul")) {
          items.push(hasText(data?.identityString) ? { type: "device", device: "spineString", text: data.identityString } : { type: "device", device: "spineString" });
        }
        break;
      default:
        b.warn(`unsur sampul tidak dikenal di cover.elementOrder: "${el}"`, "PARAM_UNKNOWN_KEY");
    }
  }
  return items;
}

function isFrontPage(v: Record<string, unknown>): boolean {
  return v.mode === "auto" || v.mode === "explicit";
}

export const renderCover: DocxBlockRenderer = (block, ctx) => {
  const page = contentOf<FrontPage>(block, "cover", isFrontPage);
  return build(ctx, block, "cover", (b) => {
    if (page.mode === "explicit" && page.body) {
      // FIX-SERAH (D-295): aparatus milik templat (D-139) yang tidak dibawa badan
      // konten-saja dipasang menurut cover.elementOrder; badan dirender apa adanya.
      const app = explicitCoverApparatus(b.params, page.body);
      if (app.before.length > 0) frontItemsXml(b, autoCoverItems(b, undefined, app.before));
      frontItemsXml(b, page.body);
      if (app.after.length > 0) frontItemsXml(b, autoCoverItems(b, undefined, app.after));
      return;
    }
    if (page.mode === "explicit") b.warn("sampul mode explicit tanpa body; disusun otomatis", "SCHEMA_INVALID");
    frontItemsXml(b, autoCoverItems(b, page.data as CoverData | undefined));
  });
};

// ── controlSheet ─────────────────────────────────────────────────────────

const K16_SPACER: ParaFormat = { spacingBeforeTw: 0, spacingAfterTw: 0, lineTw: 160, lineRule: "exact" };

/**
 * Tanda tangan dokumen (`front.signature`) ikut lembar kendali bila
 * lembar kendali ada: di akhir mode auto, dan di akhir mode explicit bila
 * body belum memuat signatureBlock. Perakit S20 tidak menempatkan
 * `signatureBlock` terpisah dalam kasus itu.
 */
export function controlSheetIncludesSignature(doc: StudioDocV1): boolean {
  return !!doc.front?.controlSheet && !!doc.front.signature;
}

/** Susun lembar kendali mode auto (urutan BM p#12..p#21 + T005..T008). */
export function autoControlSheetItems(b: WrapperBuilder, data: ControlSheetData | undefined): FrontItem[] {
  const items: FrontItem[] = [];
  const s = sealBandItem(b);
  if (s) items.push(s);
  items.push(paraItem("kicker", data?.kicker ?? textInline(controlSheetKickerText(b.lang))));
  items.push(paraItem("pageTitle", data?.title ?? textInline(b.ctx.snapshot.doc.meta.title)));
  const blocks: Array<{ kind: ControlSheetBlockKind; table?: TableBlock; method?: Inline }> = [];
  if (data?.revisionHistory) blocks.push({ kind: "revision", table: data.revisionHistory });
  if (data?.verificationChain) blocks.push({ kind: "verification", table: data.verificationChain });
  if (hasText(data?.methodStatement)) blocks.push({ kind: "method", method: data.methodStatement });
  if (data?.distribution) blocks.push({ kind: "distribution", table: data.distribution });
  blocks.forEach((blk, i) => {
    items.push(paraItem("blockHeading", textInline(controlSheetBlockHeading(i, blk.kind, b.lang))));
    if (blk.table) {
      items.push(blk.table);
      items.push({ type: "spacer", format: K16_SPACER });
    } else if (blk.method) {
      items.push(paraItem("methodStatement", blk.method));
    }
  });
  return items;
}

export const renderControlSheet: DocxBlockRenderer = (block, ctx) => {
  const page = contentOf<FrontPage>(block, "controlSheet", isFrontPage);
  return build(ctx, block, "controlSheet", (b) => {
    const signature = ctx.snapshot.doc.front?.signature;
    let items: FrontItem[];
    if (page.mode === "explicit" && page.body) {
      items = [...page.body];
      if (signature && !items.some((i) => i.type === "signatureBlock")) items.push(signature);
    } else {
      if (page.mode === "explicit") b.warn("lembar kendali mode explicit tanpa body; disusun otomatis", "SCHEMA_INVALID");
      items = autoControlSheetItems(b, page.data as ControlSheetData | undefined);
      if (signature) items.push(signature);
    }
    frontItemsXml(b, items);
  });
};

// ── toc ──────────────────────────────────────────────────────────────────

/** Entri daftar isi dari struktur dokumen (C14: bagian lalu babnya, bab tanpa bagian, lampiran). */
export function deriveTocEntries(b: WrapperBuilder): TocEntry[] {
  const doc = b.ctx.snapshot.doc;
  const out: TocEntry[] = [];
  const chapterEntry = (ch: Chapter, appendix: boolean): TocEntry => {
    const list = appendix ? (doc.appendices ?? []) : doc.chapters;
    const key = chapterKey(list, ch, appendix);
    return { level: appendix ? "appendix" : "chapter", label: textInline(chapterLabel(b, ch, key, appendix)), title: ch.title, page: "" };
  };
  const partIds = new Set((doc.parts ?? []).map((p) => p.id));
  for (const ch of doc.chapters) if (!ch.partId || !partIds.has(ch.partId)) out.push(chapterEntry(ch, false));
  for (const p of doc.parts ?? []) {
    // FIX-SERAH (D-295): label bawaan sama dengan pembatas bagian bila konten tanpa label (compose v2).
    out.push({ level: "part", label: hasText(p.label) ? p.label : textInline(defaultPartLabelText(p.id, b.lang)), title: p.title, page: "" });
    for (const ch of doc.chapters) if (ch.partId === p.id) out.push(chapterEntry(ch, false));
  }
  for (const a of doc.appendices ?? []) out.push(chapterEntry(a, true));
  return out;
}

function entryRoles(level: TocEntry["level"]): [WrapperRole, WrapperRole, WrapperRole] {
  return level === "part" ? ["toc.partLabel", "toc.partTitle", "toc.partPage"] : ["toc.chapterLabel", "toc.chapterTitle", "toc.chapterPage"];
}

/** Daftar isi statis T010 (KT-10..KT-15, TCP-11/12): label | judul | halaman. */
function staticTocTable(b: WrapperBuilder, entries: readonly TocEntry[]): void {
  const grid = scaleCols([1474, 7144, 793], b.textWidthTw());
  const rows: WRow[] = entries.map((e) => ({
    cells: entryRoles(e.level).map((role, i) => {
      const rf = roleFormat(b.ctx, role);
      const inline = i === 0 ? e.label : i === 1 ? e.title : textInline(e.page);
      return {
        widthTw: grid[i],
        borders: rf.cell?.borders,
        marginsTw: rf.cell?.marginsTw,
        shading: rf.cell?.shading,
        paragraphsXml: paragraphXml(rf.para, runsXml(inlineRuns(inline), rf.run ?? {}, b.params)),
      };
    }),
  }));
  b.push(tableXml(grid, rows));
}

/**
 * Daftar isi medan TOC (R-22 "field"): `TOC \o "1-2" \h \z \u` kompleks yang
 * membentang paragraf entri; hasil cache = entri statis tanpa halaman
 * (atau halaman literal bila diberikan) agar soffice/Word yang tidak
 * memperbarui medan tetap menampilkan isi. `updateFields` (R-03) diatur S14.
 */
function fieldTocXml(b: WrapperBuilder, entries: readonly TocEntry[]): void {
  const width = b.textWidthTw();
  const begin = `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`;
  const end = `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;
  if (entries.length === 0) {
    const rf = roleFormat(b.ctx, "toc.chapterTitle");
    b.push(paragraphXml(rf.para, begin + runsXml([{ t: L.tocPlaceholder[b.lang] }], rf.run ?? {}, b.params) + end));
    return;
  }
  entries.forEach((e, i) => {
    const [lr, tr, pr] = entryRoles(e.level).map((r) => roleFormat(b.ctx, r));
    const para: ParaFormat = { ...tr.para, tabs: [{ posTw: width, val: "right", leader: "none" }] };
    const runs =
      runsXml(inlineRuns(e.label), lr.run ?? {}, b.params) +
      runsXml([{ tab: true }], tr.run ?? {}, b.params) +
      runsXml(inlineRuns(e.title), tr.run ?? {}, b.params) +
      (e.page ? runsXml([{ tab: true }, { t: e.page }], pr.run ?? {}, b.params) : "");
    b.push(paragraphXml(para, (i === 0 ? begin : "") + runs + (i === entries.length - 1 ? end : "")));
  });
}

function isTocSpec(v: Record<string, unknown>): boolean {
  return v.mode === "field" || v.mode === "static";
}

export const renderToc: DocxBlockRenderer = (block, ctx) => {
  const spec = contentOf<TocSpec>(block, "toc", isTocSpec);
  return build(ctx, block, "toc", (b) => {
    const items: FrontItem[] = [];
    const seal = spec.sealBand ?? sealBandItem(b);
    if (seal) items.push(seal);
    items.push(paraItem("kicker", spec.kicker ?? textInline(tocKickerText(b.lang))));
    if (hasText(spec.title)) items.push(paraItem("title", spec.title));
    frontItemsXml(b, items);
    let entries = spec.entries;
    if (!entries || entries.length === 0) {
      entries = deriveTocEntries(b);
      if (spec.mode === "static") b.warn("daftar isi statis tanpa entries: entri diturunkan dari struktur dokumen tanpa nomor halaman", "BY_CONSTRUCTION_FAILED");
    }
    if (spec.mode === "static") staticTocTable(b, entries);
    else fieldTocXml(b, entries);
    if (hasText(spec.note)) b.push(roleParagraphXml(b, "toc.note", spec.note));
  });
};

// ── partDivider ──────────────────────────────────────────────────────────

/** Badan pembatas bagian bawaan (BM T011, p#27-p#28): pita, spasi 1400, Datum Rule. */
export function autoPartBody(b: WrapperBuilder): FrontItem[] {
  const items: FrontItem[] = [];
  const s = sealBandItem(b);
  if (s) items.push(s);
  items.push({ type: "spacer", format: { spacingBeforeTw: 1400, spacingAfterTw: 0, lineTw: 120, lineRule: "exact" } });
  if (rulePlaced(b, "pembatas")) items.push({ type: "device", device: "datumRule" });
  return items;
}

/** Daftar bab pembatas bagian T012 (C5: label = teks kicker bab, judul = teks judul bab; U46/U47, TCP-13). */
function partChapterList(b: WrapperBuilder, part: PartSpec): void {
  const doc = b.ctx.snapshot.doc;
  const no = roleFormat(b.ctx, "part.chapterNo");
  const ti = roleFormat(b.ctx, "part.chapterTitle");
  const grid = scaleCols([907, 8505], b.textWidthTw());
  const rows: WRow[] = [];
  for (const key of part.chapterKeys) {
    const hit = findChapter(doc, key);
    if (!hit) {
      b.warn(`chapterKeys "${key}" pada bagian ${part.id} tidak menunjuk bab mana pun`, "ADDRESS_NOT_FOUND");
      continue;
    }
    rows.push({
      cells: [
        {
          widthTw: grid[0],
          borders: no.cell?.borders,
          marginsTw: no.cell?.marginsTw,
          shading: no.cell?.shading,
          paragraphsXml: paragraphXml(no.para, runsXml([{ t: chapterLabel(b, hit.ch, key, hit.appendix) }], no.run ?? {}, b.params)),
        },
        {
          widthTw: grid[1],
          borders: ti.cell?.borders,
          marginsTw: ti.cell?.marginsTw,
          shading: ti.cell?.shading,
          paragraphsXml: paragraphXml(ti.para, runsXml([{ t: inlinePlain(hit.ch.title) }], ti.run ?? {}, b.params)),
        },
      ],
    });
  }
  if (rows.length > 0) b.push(tableXml(grid, rows));
}

function isPartSpec(v: Record<string, unknown>): boolean {
  return typeof v.id === "string" && isObj(v.title) && Array.isArray(v.chapterKeys);
}

export const renderPartDivider: DocxBlockRenderer = (block, ctx) => {
  const part = contentOf<PartSpec>(block, "partDivider", isPartSpec);
  return build(ctx, block, "part", (b) => {
    const body = part.body && part.body.length > 0 ? part.body : autoPartBody(b);
    frontItemsXml(b, body);
    const label = hasText(part.label) ? part.label : textInline(defaultPartLabelText(part.id, b.lang));
    b.push(roleParagraphXml(b, "wrapper.kicker", label));
    b.push(roleParagraphXml(b, "part.title", part.title));
    if (hasText(part.lede)) b.push(roleParagraphXml(b, "part.lede", part.lede));
    if (part.showChapterList !== false && part.chapterKeys.length > 0) partChapterList(b, part);
    if (!part.body && spinePlaced(b, "pembatas")) {
      b.push(spineXml(b, { runs: [{ t: spineText(b), caps: true }] }));
    }
  });
};

// ── signatureBlock ───────────────────────────────────────────────────────

function isSignature(v: Record<string, unknown>): boolean {
  return v.type === "signatureBlock" && Array.isArray(v.roles);
}

export const renderSignatureBlock: DocxBlockRenderer = (block, ctx) => {
  const sig = contentOf<SignatureBlock>(block, "signatureBlock", isSignature);
  return build(ctx, block, "signature", (b) => signatureXml(b, sig));
};

// ── appendix (pembuka) ───────────────────────────────────────────────────

/**
 * Pembuka lampiran: normalisasi S48 memisahkan seksi menjadi blok sendiri,
 * sehingga isi blok `appendix` = {key, kicker, title, setup} tanpa `sections`
 * (D-79). `sections`, bila ada, tetap harus larik.
 */
function isChapter(v: Record<string, unknown>): boolean {
  return isObj(v.title) && (v.sections === undefined || Array.isArray(v.sections));
}

export const renderAppendixOpener: DocxBlockRenderer = (block, ctx) => {
  const ch = contentOf<Chapter>(block, "appendix", isChapter);
  return build(ctx, block, "appendix", (b) => {
    const apps = ctx.snapshot.doc.appendices ?? [];
    const idx = apps.findIndex((a) => a === ch || (!!ch.blockId && a.blockId === ch.blockId));
    const key = ch.key ?? (idx >= 0 ? String.fromCharCode(65 + idx) : block.unitKey);
    const kicker = hasText(ch.kicker) ? ch.kicker : textInline(appendixOpenerKickerText(key, b.lang, b.params["appendix.kicker.pattern"]));
    b.push(roleParagraphXml(b, "chapter.kicker", kicker));
    if (rulePlaced(b, "atas judul bab")) b.push(datumRuleParagraphXml(b));
    b.push(roleParagraphXml(b, "chapter.title", ch.title));
  });
};

// ── Ekspor pembantu untuk perakit/header ─────────────────────────────────

/**
 * Paragraf Datum Rule mandiri (mis. untuk penempatan di kepala/kaki halaman
 * oleh S14/S20): mengembalikan fragmen dengan media rule.
 */
export function datumRuleFragment(ctx: RenderContext, block: NormBlock, opts: { interior: boolean; widthMm?: number; format?: ParaFormat }): DocxFragment {
  return build(ctx, block, opts.interior ? "appendix" : "part", (b) => {
    b.push(datumRuleParagraphXml(b, { widthMm: opts.widthMm, format: opts.format ?? paraOf(ctx, opts.interior ? "chapter.datumRule" : "wrapper.datumRule") }));
  });
}

export { sealBandTexts };
