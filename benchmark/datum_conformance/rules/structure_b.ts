/**
 * Modul aturan structure_b (S22): CR-1, running head (RH), blok register (RB), pita segel (SB),
 * cap terbit (IS), geometri/fon (GF) dan perangkat Datum Rule (DV). Sumber: research/32 §2, §5-§7;
 * nilai per bahasa dan konstanta di `expect_structure_b.ts` (dipilih lewat `pair.language`).
 *
 * GF-13 dan RH-03 diimplementasikan persis menurut katalog walau mesin saat ini diperkirakan gagal
 * (research/31 F-4, D-598: kegagalan non-kritis yang diketahui).
 */
import type { DocxDocument } from "../lib/docx";
import { colorNear, isSealBandTable, type ClassifiedSection } from "../lib/layout";
import { ancestor, attr, attrNum, child, childPath, children, descendants, rawText, type XmlElement } from "../lib/xml";
import {
  ANRI_LEVELS,
  BANNED_FONTS,
  BODY_LINE,
  CHAPTER_KICKER,
  COLOR,
  EM_DASH,
  FORBIDDEN_CLASSIFICATION,
  GEOMETRY as G,
  isSerifFont,
  LANG_EXPECT,
  NBSP,
  REGISTER_DATE,
  REGISTER_ORG,
  RETIRED_COLORS,
  ROMAN_MONTHS,
  RULE_SIZE,
  RUN_SIZE,
  RUNNING_HEAD_ENTITY,
} from "./expect_structure_b";
import { isCondFont } from "./fonts";
import { defineRule, fail, na, pass, unexercised, type Rule, type RuleContext, type RuleResult } from "./types";

// ── Utilitas ─────────────────────────────────────────────────────────────

/** Spasi dinormalkan: NBSP, tab dan runtun spasi menjadi satu spasi, ujung dipangkas. */
function norm(s: string): string {
  return s.split(NBSP).join(" ").replace(/\s+/g, " ").trim();
}

const near = (v: number | undefined, want: number, tol: number): boolean => v !== undefined && Math.abs(v - want) <= tol;
const sectionLoc = (s: ClassifiedSection, extra = ""): string => `seksi ${s.index}${extra ? `, ${extra}` : ""}`;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Frasa utuh (batas bukan huruf/angka) di teks. */
function hasPhrase(text: string, phrase: string): boolean {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(phrase)}([^\\p{L}\\p{N}]|$)`, "u").test(text);
}

/** Kegagalan pertama dari daftar, atau lulus. */
function verdict(problems: readonly string[], okEvidence: string, extra: { part?: string; location?: string; observed?: string } = {}): RuleResult {
  if (problems.length === 0) return pass(okEvidence, extra);
  const more = problems.length > 1 ? ` (+${problems.length - 1} temuan lain)` : "";
  return fail(`${problems[0]}${more}`, { ...extra, observed: problems.slice(0, 5).join(" | ") });
}

function textRuns(docx: DocxDocument, scope: XmlElement | readonly XmlElement[]): XmlElement[] {
  return docx.paragraphs(scope).flatMap((p) => docx.runs(p).filter((r) => docx.runText(r).trim() !== ""));
}

/** Tingkat outline efektif; 9 (tingkat teks badan) = tanpa tingkat. */
function outlineOf(docx: DocxDocument, p: XmlElement): number | undefined {
  const lvl = docx.effectiveParaProps(p).outlineLvl;
  return lvl === undefined || lvl >= 9 ? undefined : lvl;
}

const topParas = (s: ClassifiedSection): XmlElement[] => s.blocks.filter((b) => b.name === "w:p");

function extents(scope: XmlElement): { cx: number; cy: number }[] {
  return descendants(scope, "wp:extent").map((e) => ({ cx: attrNum(e, "cx") ?? 0, cy: attrNum(e, "cy") ?? 0 }));
}

interface ChapterInfo {
  readonly heading: XmlElement;
  readonly headingIdx: number;
  readonly title: string;
  readonly kicker?: { readonly p: XmlElement; readonly key: string; readonly text: string };
}

/** Judul bab (outline 0) pertama di blok teratas seksi dan kicker sebelum judul itu. */
function chapterOf(docx: DocxDocument, s: ClassifiedSection): ChapterInfo | undefined {
  const paras = topParas(s);
  const headingIdx = paras.findIndex((p) => outlineOf(docx, p) === 0);
  if (headingIdx < 0) return undefined;
  const heading = paras[headingIdx];
  let kicker: ChapterInfo["kicker"];
  for (let i = headingIdx - 1; i >= 0; i--) {
    const t = norm(docx.paragraphText(paras[i], { visible: true }));
    const m = CHAPTER_KICKER.exec(t);
    if (m) {
      kicker = { p: paras[i], key: m[2], text: t };
      break;
    }
  }
  return { heading, headingIdx, title: norm(docx.paragraphText(heading, { visible: true })), kicker };
}

/** Paragraf kicker pembuka bab di seksi interior (teks tampak cocok LB-03, kedua bahasa). */
function chapterKickers(ctx: RuleContext): { s: ClassifiedSection; p: XmlElement }[] {
  const out: { s: ClassifiedSection; p: XmlElement }[] = [];
  for (const s of ctx.layout.interiors) {
    for (const p of topParas(s)) {
      if (CHAPTER_KICKER.test(norm(ctx.docx.paragraphText(p, { visible: true })))) out.push({ s, p });
    }
  }
  return out;
}

// ── Running head ─────────────────────────────────────────────────────────

interface HeadSplit {
  readonly part: string;
  readonly para?: XmlElement;
  readonly leftRuns: readonly XmlElement[];
  readonly rightRuns: readonly XmlElement[];
  /** Teks tampak kiri/kanan (caps efektif dikapitalkan). */
  readonly left: string;
  readonly right: string;
  /** true bila setiap run kanan bertek tampil kapital (sumber kapital atau w:caps). */
  readonly rightCapital: boolean;
}

/** Paragraf running head = paragraf pertama header yang bertek; kanan = teks sesudah tab pertama. */
function splitHead(docx: DocxDocument, part: string): HeadSplit {
  const root = docx.part(part);
  const para = root ? docx.paragraphs(root).find((p) => docx.paragraphText(p).trim() !== "") : undefined;
  const leftRuns: XmlElement[] = [];
  const rightRuns: XmlElement[] = [];
  let left = "";
  let right = "";
  let rightCapital = true;
  let afterTab = false;
  for (const run of para ? docx.runs(para) : []) {
    const caps = docx.effectiveRunProps(run).caps;
    let l = "";
    let rt = "";
    for (const c of children(run)) {
      if (c.name === "w:tab" || c.name === "w:ptab") {
        afterTab = true;
        continue;
      }
      const piece = c.name === "w:t" ? rawText(c) : c.name === "w:noBreakHyphen" ? "-" : "";
      if (afterTab) rt += piece;
      else l += piece;
    }
    if (l.trim()) {
      leftRuns.push(run);
      left += caps ? l.toUpperCase() : l;
    }
    if (rt.trim()) {
      rightRuns.push(run);
      right += caps ? rt.toUpperCase() : rt;
      if (!caps && rt !== rt.toUpperCase()) rightCapital = false;
    }
  }
  return { part, para, leftRuns, rightRuns, left: norm(left), right: norm(right), rightCapital };
}

interface HeadAt {
  readonly s: ClassifiedSection;
  readonly head?: HeadSplit;
}

function interiorHeads(ctx: RuleContext): HeadAt[] {
  return ctx.layout.interiors.map((s) => ({ s, head: s.headers.default ? splitHead(ctx.docx, s.headers.default) : undefined }));
}

/** Nilai acuan K = teks tampak kanan header default seksi interior pertama (CR-1 butir 1). */
function referenceClassification(ctx: RuleContext): { k: string; part: string } | undefined {
  const first = ctx.layout.interiors[0];
  const part = first?.headers.default;
  if (!part) return undefined;
  const k = splitHead(ctx.docx, part).right;
  return k ? { k, part } : undefined;
}

/** Garis bawah paragraf efektif: pPr langsung, lalu rantai gaya paragraf. */
function paraBottomBorder(docx: DocxDocument, p: XmlElement): XmlElement | undefined {
  const direct = childPath(p, "w:pPr", "w:pBdr", "w:bottom");
  if (direct) return direct;
  const sid = attr(childPath(p, "w:pPr", "w:pStyle"), "w:val");
  for (const st of docx.styleChain(sid)) {
    const b = childPath(st, "w:pPr", "w:pBdr", "w:bottom");
    if (b) return b;
  }
  return undefined;
}

const isNoBorder = (b: XmlElement | undefined): boolean => !b || ["nil", "none"].includes(attr(b, "w:val") ?? "none");

// ── Blok register ────────────────────────────────────────────────────────

interface RegisterAt {
  readonly s: ClassifiedSection;
  readonly part?: string;
  readonly tbl?: XmlElement;
  readonly cells: readonly XmlElement[];
}

function interiorRegisters(ctx: RuleContext): RegisterAt[] {
  return ctx.layout.interiors.map((s) => {
    const part = s.footers.default;
    const tbl = part ? ctx.layout.registerTables.get(part) : undefined;
    const tr = tbl ? ctx.docx.tableRows(tbl)[0] : undefined;
    return { s, part, tbl, cells: tr ? ctx.docx.rowCells(tr) : [] };
  });
}

interface ClassifiedRun {
  readonly run: XmlElement;
  /** Instruksi medan bila run adalah hasil medan (fldSimple atau kompleks antara separate dan end). */
  readonly field?: string;
}

/** Run bertek dalam urutan dokumen, ditandai apakah hasil medan; run pengendali medan dilewati. */
function classifyRuns(scope: XmlElement): ClassifiedRun[] {
  const out: ClassifiedRun[] = [];
  let state: "none" | "instr" | "result" = "none";
  let instr = "";
  for (const run of descendants(scope, "w:r")) {
    const fc = child(run, "w:fldChar");
    if (fc) {
      const t = attr(fc, "w:fldCharType");
      if (t === "begin") {
        state = "instr";
        instr = "";
      } else if (t === "separate") state = "result";
      else if (t === "end") state = "none";
      continue;
    }
    const it = child(run, "w:instrText");
    if (it) {
      if (state === "instr") instr += rawText(it);
      continue;
    }
    const fs = ancestor(run, "w:fldSimple");
    const field = fs ? (attr(fs, "w:instr") ?? "").trim() : state === "result" ? instr.trim() : undefined;
    out.push({ run, field });
  }
  return out;
}

function registerDate(docx: DocxDocument, reg: RegisterAt | undefined): string | undefined {
  const c2 = reg?.cells[1];
  if (!c2) return undefined;
  const m = /^REV \S+ · (.+)$/.exec(norm(docx.cellText(c2)));
  return m ? m[1] : undefined;
}

function cellBorder(tbl: XmlElement, tc: XmlElement, side: "top" | "bottom"): XmlElement | undefined {
  return childPath(tc, "w:tcPr", "w:tcBorders", `w:${side}`) ?? childPath(tbl, "w:tblPr", "w:tblBorders", `w:${side}`);
}

function describeBorder(b: XmlElement | undefined): string {
  return b ? `${attr(b, "w:val")}/${attr(b, "w:color")}/sz ${attr(b, "w:sz")}` : "tanpa garis";
}

// ── Pita segel dan cap terbit ────────────────────────────────────────────

interface Stamp {
  readonly s: ClassifiedSection;
  readonly p: XmlElement;
  readonly text: string;
}

/** Cap terbit = paragraf seksi pembungkus yang teksnya diawali `//` (sisi kanan kolofon). */
function issueStamps(ctx: RuleContext): Stamp[] {
  const out: Stamp[] = [];
  for (const s of ctx.layout.wrappers) {
    for (const p of ctx.docx.paragraphs(s.blocks)) {
      const text = ctx.docx.paragraphText(p, { visible: true }).trim();
      if (text.startsWith("//")) out.push({ s, p, text });
    }
  }
  return out;
}

function sealCells(ctx: RuleContext, tbl: XmlElement): XmlElement[] {
  return ctx.docx.rowCells(ctx.docx.tableRows(tbl)[0]);
}

// ── Aturan ───────────────────────────────────────────────────────────────

const cr1 = defineRule("CR-1", (ctx) => {
  const { docx, pair, layout } = ctx;
  if (layout.interiors.length === 0) return fail("tidak ada seksi interior (footer dengan medan PAGE); acuan klasifikasi tidak ada");
  const ref = referenceClassification(ctx);
  if (!ref) return fail("run kanan header default seksi interior pertama kosong; klasifikasi tidak ditandai", { location: sectionLoc(layout.interiors[0]) });
  const k = ref.k;
  const problems: string[] = [];
  if (!ANRI_LEVELS.includes(k.toUpperCase())) problems.push(`klasifikasi "${k}" bukan tingkat skema ANRI (${ANRI_LEVELS.join(", ")})`);
  const forbidden = (where: string, text: string) => {
    for (const f of FORBIDDEN_CLASSIFICATION) if (hasPhrase(text.toUpperCase(), f) && !ANRI_LEVELS.includes(text.toUpperCase())) problems.push(`${where}: memuat padanan/derajat terlarang "${f}"`);
  };
  for (const { s, head } of interiorHeads(ctx)) {
    const where = `header ${head?.part ?? "-"} (${sectionLoc(s)})`;
    if (!head || head.right === "") {
      problems.push(`${where}: klasifikasi tidak ada di run kanan`);
      continue;
    }
    if (head.right !== k) problems.push(`${where}: "${head.right}" berbeda dari acuan "${k}"`);
    if (!head.rightCapital) problems.push(`${where}: klasifikasi tidak tampil kapital`);
    forbidden(where, head.right);
  }
  for (const reg of interiorRegisters(ctx)) {
    const where = `register ${reg.part ?? "-"} (${sectionLoc(reg.s)})`;
    const c4 = reg.cells[3];
    if (!c4) {
      problems.push(`${where}: sel ke-4 tabel register tidak ada`);
      continue;
    }
    const src = norm(docx.cellText(c4));
    const vis = norm(docx.cellText(c4, { visible: true }));
    if (vis !== k) problems.push(`${where}: sel ke-4 "${vis}" berbeda dari acuan "${k}"`);
    else if (src !== src.toUpperCase() && vis === src) problems.push(`${where}: sel ke-4 tidak tampil kapital`);
    forbidden(where, vis);
  }
  if (pair.tier !== "NOTA") {
    const prefix = LANG_EXPECT[pair.language].sealLeftPrefix;
    if (layout.sealBandTables.length === 0) problems.push("tier TERBIT/SERAH tanpa tabel pita segel; klasifikasi pita tidak ada");
    for (const tbl of layout.sealBandTables) {
      const left = sealCells(ctx, tbl)[0];
      const vis = norm(left ? docx.cellText(left, { visible: true }) : "");
      if (!vis.startsWith(norm(prefix))) {
        problems.push(`pita segel kiri "${vis}" tanpa awalan "${prefix.trim()}"`);
        continue;
      }
      const v = norm(vis.slice(norm(prefix).length));
      if (v !== k) problems.push(`pita segel kiri: klasifikasi "${v}" berbeda dari acuan "${k}"`);
      forbidden("pita segel kiri", v);
    }
  }
  const where = pair.tier === "NOTA" ? "kepala halaman dan register" : "kepala halaman, register, dan pita segel";
  return verdict(problems, `klasifikasi "${k}" (ANRI, kapital) identik di ${where} (${layout.interiors.length} seksi interior)`, { part: ref.part, observed: k });
});

const rh01 = defineRule("RH-01", (ctx) => {
  const { docx, pair } = ctx;
  const problems: string[] = [];
  for (const h of docx.headerParts()) {
    const root = docx.part(h);
    if (root && descendants(root, "w:drawing").length > 0) problems.push(`${h}: memuat w:drawing (logo di kepala halaman)`);
  }
  const word = LANG_EXPECT[pair.language].chapterWord;
  let checked = 0;
  for (const { s, head } of interiorHeads(ctx)) {
    const ch = chapterOf(docx, s);
    if (!ch) continue;
    checked++;
    const text = head ? norm(`${head.left} ${head.right}`).toUpperCase() : "";
    const where = `header ${head?.part ?? "-"} (${sectionLoc(s)})`;
    if (!text.includes(RUNNING_HEAD_ENTITY)) problems.push(`${where}: tanpa entitas ${RUNNING_HEAD_ENTITY}`);
    if (ch.kicker) {
      const label = `${word} ${ch.kicker.key}`.toUpperCase();
      if (!hasPhrase(text, label)) problems.push(`${where}: tanpa label bab "${label}"`);
    } else if (!ch.title || !text.includes(ch.title.toUpperCase())) {
      problems.push(`${where}: kicker bab ditekan dan judul bab "${ch.title}" tidak ada di kepala halaman`);
    }
  }
  if (checked === 0 && problems.length === 0) return unexercised("tidak ada seksi interior yang memuat judul bab (outline 0)");
  return verdict(problems, `${checked} kepala halaman bab memuat entitas dan label bab ${word}; tanpa gambar di header`);
});

const rh03 = defineRule("RH-03", (ctx) => {
  const problems: string[] = [];
  const heads = interiorHeads(ctx);
  for (const { s, head } of heads) {
    const where = `header ${head?.part ?? "-"} (${sectionLoc(s)})`;
    if (!head?.para) {
      problems.push(`${where}: paragraf running head tidak ada`);
      continue;
    }
    const b = paraBottomBorder(ctx.docx, head.para);
    if (isNoBorder(b)) problems.push(`${where}: tanpa garis bawah kepala halaman`);
    else if (!colorNear(attr(b, "w:color"), COLOR.seal) || !near(attrNum(b, "w:sz"), RULE_SIZE.runningHead, RULE_SIZE.tol))
      problems.push(`${where}: garis ${describeBorder(b)}, harapan ${COLOR.seal}/sz ${RULE_SIZE.runningHead}+-${RULE_SIZE.tol}`);
  }
  if (heads.length === 0) return fail("tidak ada seksi interior");
  return verdict(problems, `garis kepala ${COLOR.seal} sz ${RULE_SIZE.runningHead} di ${heads.length} header interior`);
});

const rh04 = defineRule("RH-04", (ctx) => {
  const problems: string[] = [];
  const heads = interiorHeads(ctx);
  for (const { s, head } of heads) {
    const where = `header ${head?.part ?? "-"} (${sectionLoc(s)})`;
    if (!head || head.leftRuns.length === 0) {
      problems.push(`${where}: run kiri kepala halaman tidak ada`);
      continue;
    }
    for (const run of head.leftRuns) {
      const c = ctx.docx.effectiveRunProps(run).color;
      if (!colorNear(c, COLOR.ink400)) problems.push(`${where}: warna run kiri ${c ?? "tanpa warna"}, harapan ${COLOR.ink400}`);
    }
  }
  if (heads.length === 0) return fail("tidak ada seksi interior");
  return verdict(problems, `teks kiri kepala halaman ${COLOR.ink400} di ${heads.length} header interior`);
});

const rb01 = defineRule("RB-01", (ctx) => {
  const regs = interiorRegisters(ctx);
  if (regs.length === 0) return fail("tidak ada seksi interior");
  const problems: string[] = [];
  for (const reg of regs) {
    const root = reg.part ? ctx.docx.part(reg.part) : undefined;
    const hasPage = root ? ctx.docx.fieldInstructions(root).some((f) => /^PAGE\b/.test(f.instr)) : false;
    if (!reg.tbl) problems.push(`${sectionLoc(reg.s)}: footer ${reg.part ?? "-"} tanpa tabel register 1x4`);
    if (!hasPage) problems.push(`${sectionLoc(reg.s)}: footer ${reg.part ?? "-"} tanpa medan PAGE`);
  }
  return verdict(problems, `${regs.length} seksi interior berblok register dengan medan PAGE`);
});

const rb02 = defineRule("RB-02", (ctx) => {
  const { docx, pair } = ctx;
  const regs = interiorRegisters(ctx);
  if (regs.length === 0) return fail("tidak ada seksi interior");
  const L = LANG_EXPECT[pair.language];
  const k = referenceClassification(ctx)?.k;
  const sheetRe = new RegExp(`^${L.sheetWord} \\S+ ${L.ofWord} \\S+$`);
  const problems: string[] = [];
  for (const reg of regs) {
    const where = `${reg.part ?? "-"} (${sectionLoc(reg.s)})`;
    if (reg.cells.length !== 4) {
      problems.push(`${where}: tabel register tidak 1x4`);
      continue;
    }
    const t = reg.cells.map((c) => norm(docx.cellText(c)));
    if (!new RegExp(`^${escapeRe(REGISTER_ORG)} · \\S.*$`).test(t[0])) problems.push(`${where}: sel 1 "${t[0]}" bukan "${REGISTER_ORG} · <nomor>"`);
    if (!/^REV \S+ · \S.*$/.test(t[1])) problems.push(`${where}: sel 2 "${t[1]}" bukan "REV <rev> · <tanggal>"`);
    if (!sheetRe.test(t[2])) problems.push(`${where}: sel 3 "${t[2]}" bukan "${L.sheetWord} <n> ${L.ofWord} <N>"`);
    const f = docx.fieldInstructions(reg.cells[2]).map((x) => x.instr.split(/\s+/)[0]);
    const pi = f.indexOf("PAGE");
    const ni = f.indexOf("NUMPAGES");
    if (pi < 0 || ni < 0 || pi > ni) problems.push(`${where}: sel 3 tanpa urutan medan PAGE lalu NUMPAGES (${f.join(",") || "tanpa medan"})`);
    const c4 = norm(docx.cellText(reg.cells[3], { visible: true }));
    if (k ? c4 !== k : !ANRI_LEVELS.includes(c4)) problems.push(`${where}: sel 4 "${c4}" bukan klasifikasi${k ? ` "${k}"` : ""}`);
  }
  return verdict(problems, `urutan sel register benar (${L.sheetWord}/${L.ofWord}, klasifikasi terakhir) di ${regs.length} footer interior`);
});

const rb03 = defineRule("RB-03", (ctx) => {
  const { docx } = ctx;
  const regs = interiorRegisters(ctx);
  if (regs.length === 0) return fail("tidak ada seksi interior");
  const k = referenceClassification(ctx)?.k;
  const problems: string[] = [];
  for (const reg of regs) {
    const where = `${reg.part ?? "-"} (${sectionLoc(reg.s)})`;
    if (reg.cells.length !== 4) {
      problems.push(`${where}: tabel register tidak 1x4`);
      continue;
    }
    const f = docx.fieldInstructions(reg.cells[2]).map((x) => x.instr);
    if (!f.some((x) => /^PAGE\b/.test(x)) || !f.some((x) => /^NUMPAGES\b/.test(x))) problems.push(`${where}: sel 3 tanpa medan PAGE dan NUMPAGES`);
    reg.cells.forEach((c, i) => {
      for (const { run, field } of classifyRuns(c)) {
        if (field !== undefined) continue;
        let t = docx.runText(run);
        // Nilai klasifikasi (mis. SANGAT RAHASIA) adalah nilai medan, bukan teks literal pola.
        if (i === 3 && k) t = t.split(k).join("");
        if (t.includes(" ")) problems.push(`${where}: sel ${i + 1} run literal "${t}" memuat spasi U+0020 (harapan NBSP)`);
      }
    });
  }
  return verdict(problems, `medan PAGE/NUMPAGES ada dan semua spasi literal register = NBSP di ${regs.length} footer`);
});

const rb04 = defineRule("RB-04", (ctx) => {
  const { docx } = ctx;
  const regs = interiorRegisters(ctx);
  if (regs.length === 0) return fail("tidak ada seksi interior");
  const prefixLen = `${REGISTER_ORG} · `.length;
  const problems: string[] = [];
  const check = (where: string, run: XmlElement, what: string) => {
    const rp = docx.effectiveRunProps(run);
    if (!rp.bold || !colorNear(rp.color, COLOR.ink900)) problems.push(`${where}: ${what} "${docx.runText(run)}" tebal=${rp.bold} warna=${rp.color ?? "-"}, harapan tebal ${COLOR.ink900}`);
  };
  for (const reg of regs) {
    const where = `${reg.part ?? "-"} (${sectionLoc(reg.s)})`;
    if (reg.cells.length !== 4) {
      problems.push(`${where}: tabel register tidak 1x4`);
      continue;
    }
    let offset = 0;
    let numberRuns = 0;
    for (const { run, field } of classifyRuns(reg.cells[0])) {
      if (field !== undefined) continue;
      const t = docx.runText(run).split(NBSP).join(" ");
      const end = offset + t.length;
      if (end > prefixLen && t.slice(Math.max(0, prefixLen - offset)).trim() !== "") {
        numberRuns++;
        check(where, run, "nomor dokumen");
      }
      offset = end;
    }
    if (numberRuns === 0) problems.push(`${where}: nilai nomor dokumen tidak ada di sel 1`);
    const pageRuns = classifyRuns(reg.cells[2]).filter((x) => x.field !== undefined && /^PAGE\b/.test(x.field));
    if (pageRuns.length === 0) problems.push(`${where}: hasil medan PAGE tidak ada di sel 3`);
    for (const { run } of pageRuns) check(where, run, "nomor lembar");
  }
  return verdict(problems, `nomor dokumen dan nomor lembar tebal ${COLOR.ink900} di ${regs.length} footer`);
});

const rb05 = defineRule("RB-05", (ctx) => {
  const regs = interiorRegisters(ctx);
  if (regs.length === 0) return fail("tidak ada seksi interior");
  const problems: string[] = [];
  for (const reg of regs) {
    const where = `${reg.part ?? "-"} (${sectionLoc(reg.s)})`;
    if (!reg.tbl || reg.cells.length === 0) {
      problems.push(`${where}: tabel register tidak ada`);
      continue;
    }
    reg.cells.forEach((tc, i) => {
      const top = cellBorder(reg.tbl!, tc, "top");
      const bottom = cellBorder(reg.tbl!, tc, "bottom");
      if (isNoBorder(top) || !colorNear(attr(top, "w:color"), COLOR.seal) || !near(attrNum(top, "w:sz"), RULE_SIZE.registerTop, RULE_SIZE.tol))
        problems.push(`${where}: sel ${i + 1} garis atas ${describeBorder(top)}, harapan ${COLOR.seal}/sz ${RULE_SIZE.registerTop}+-${RULE_SIZE.tol}`);
      if (isNoBorder(bottom) || !colorNear(attr(bottom, "w:color"), COLOR.ink200) || !RULE_SIZE.registerBottom.includes(attrNum(bottom, "w:sz") ?? -1))
        problems.push(`${where}: sel ${i + 1} garis bawah ${describeBorder(bottom)}, harapan ${COLOR.ink200}/sz ${RULE_SIZE.registerBottom.join(" atau ")}`);
    });
  }
  return verdict(problems, `garis register atas ${COLOR.seal} sz ${RULE_SIZE.registerTop}, bawah ${COLOR.ink200} di ${regs.length} footer`);
});

const rb06 = defineRule("RB-06", (ctx) => {
  const regs = interiorRegisters(ctx);
  if (regs.length === 0) return fail("tidak ada seksi interior");
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const reg of regs) {
    const d = registerDate(ctx.docx, reg);
    if (d === undefined) problems.push(`${reg.part ?? "-"} (${sectionLoc(reg.s)}): sel 2 tanpa bagian tanggal`);
    else if (!REGISTER_DATE.test(d)) problems.push(`${reg.part ?? "-"} (${sectionLoc(reg.s)}): tanggal "${d}" bukan DD-<Romawi>-YYYY`);
    else seen.add(d);
  }
  return verdict(problems, `tanggal register ${[...seen].join(", ")} berformat DD-<Romawi>-YYYY`);
});

const rb07 = defineRule("RB-07", (ctx) => {
  const { docx, layout } = ctx;
  if (layout.wrappers.length === 0) return fail("tier TERBIT/SERAH tanpa seksi pembungkus (halaman depan)");
  const problems: string[] = [];
  for (const s of layout.wrappers) {
    for (const part of new Set(Object.values(s.footers))) {
      const root = docx.part(part);
      if (!root) continue;
      const f = docx.fieldInstructions(root).filter((x) => /^(PAGE|NUMPAGES)\b/.test(x.instr));
      if (f.length > 0) problems.push(`${sectionLoc(s)}: footer ${part} memuat medan ${f.map((x) => x.instr).join(", ")}`);
      if (layout.registerTables.has(part)) problems.push(`${sectionLoc(s)}: footer ${part} memuat tabel register`);
    }
  }
  return verdict(problems, `${layout.wrappers.length} seksi pembungkus tanpa blok register maupun medan PAGE/NUMPAGES`);
});

const rb08 = defineRule("RB-08", (ctx) => {
  const problems: string[] = [];
  for (const s of ctx.layout.sections) {
    if (s.pgNumStart === undefined) continue;
    if (!(s.index === 0 && s.pgNumStart === 1)) problems.push(`seksi ${s.index}: w:pgNumType/@w:start=${s.pgNumStart} (mulai ulang)`);
  }
  return verdict(problems, `tidak ada mulai ulang nomor lembar di ${ctx.layout.sections.length} seksi`);
});

const sb01 = defineRule("SB-01", (ctx) => {
  const { docx, layout } = ctx;
  const problems: string[] = [];
  const headOk = (s: ClassifiedSection | undefined, name: string) => {
    if (!s) {
      problems.push(`seksi ${name} tidak ada`);
      return;
    }
    const first = s.blocks[0];
    if (!first || first.name !== "w:tbl" || !isSealBandTable(docx, first)) problems.push(`${name} (${sectionLoc(s)}): blok pertama bukan tabel pita segel (${first?.name ?? "kosong"})`);
  };
  headOk(layout.cover, "SAMPUL");
  headOk(layout.controlSheet, "LEMBAR KENDALI");
  for (const s of layout.interiors) {
    if (docx.tables(s.blocks).some((t) => isSealBandTable(docx, t))) problems.push(`${sectionLoc(s)}: seksi interior memuat tabel pita segel`);
  }
  return verdict(problems, `pita segel di kepala SAMPUL dan LEMBAR KENDALI; ${layout.interiors.length} seksi interior tanpa pita segel`);
});

const sb02 = defineRule("SB-02", (ctx) => {
  const { docx, layout } = ctx;
  if (layout.sealBandTables.length === 0) return fail("tidak ada tabel pita segel");
  const problems: string[] = [];
  layout.sealBandTables.forEach((tbl, i) => {
    const where = `pita segel ${i + 1}`;
    const cells = sealCells(ctx, tbl);
    cells.forEach((tc, j) => {
      const fill = attr(childPath(tc, "w:tcPr", "w:shd"), "w:fill");
      if (!colorNear(fill, COLOR.seal)) problems.push(`${where}: sel ${j + 1} isian ${fill ?? "-"}, harapan ${COLOR.seal}`);
    });
    for (const run of textRuns(docx, tbl)) {
      const c = docx.effectiveRunProps(run).color;
      if (!colorNear(c, COLOR.sealText)) problems.push(`${where}: warna teks ${c ?? "-"}, harapan ${COLOR.sealText}`);
    }
    const tblW = childPath(tbl, "w:tblPr", "w:tblW");
    const width = attr(tblW, "w:type") === "dxa" && attrNum(tblW, "w:w") !== undefined ? attrNum(tblW, "w:w")! : docx.gridCols(tbl).reduce((a, b) => a + b, 0);
    if (!near(width, G.textWidth, G.textWidthTol)) problems.push(`${where}: lebar ${width} tw, harapan ${G.textWidth}+-${G.textWidthTol}`);
    const h = attrNum(childPath(docx.tableRows(tbl)[0], "w:trPr", "w:trHeight"), "w:val");
    if (h !== undefined && !near(h, G.sealBandHeight, G.sealBandHeightTol)) problems.push(`${where}: tinggi ${h} tw, harapan ${G.sealBandHeight}+-${G.sealBandHeightTol}`);
  });
  return verdict(problems, `${layout.sealBandTables.length} pita segel: isian ${COLOR.seal}, teks ${COLOR.sealText}, lebar ${G.textWidth} tw`);
});

const sb03 = defineRule("SB-03", (ctx) => {
  const { docx, layout, pair } = ctx;
  if (layout.sealBandTables.length === 0) return fail("tidak ada tabel pita segel");
  const L = LANG_EXPECT[pair.language];
  const k = referenceClassification(ctx)?.k;
  const problems: string[] = [];
  layout.sealBandTables.forEach((tbl, i) => {
    const [lc, rc] = sealCells(ctx, tbl);
    const left = (lc ? docx.cellText(lc, { visible: true }) : "").trim();
    const right = (rc ? docx.cellText(rc, { visible: true }) : "").trim();
    const wantLeft = k ? `${L.sealLeftPrefix}${k}` : undefined;
    if (wantLeft ? left !== wantLeft : !left.startsWith(L.sealLeftPrefix) || left.length === L.sealLeftPrefix.length)
      problems.push(`pita segel ${i + 1}: kiri "${left}", harapan "${wantLeft ?? `${L.sealLeftPrefix}<K>`}"`);
    if (pair.hasCopyControl ? right === "" : right !== L.sealRight) problems.push(`pita segel ${i + 1}: kanan "${right}", harapan "${pair.hasCopyControl ? "<meta.copyControl>" : L.sealRight}"`);
  });
  return verdict(problems, `teks pita ${pair.language} benar di ${layout.sealBandTables.length} pita segel`);
});

const is01 = defineRule("IS-01", (ctx) => {
  const stamps = issueStamps(ctx);
  if (stamps.length === 0) return fail("cap terbit (paragraf pembungkus berawalan //) tidak ditemukan");
  const re = LANG_EXPECT[ctx.pair.language].issueStamp;
  const problems: string[] = [];
  for (const st of stamps) {
    if (st.text.includes(EM_DASH)) problems.push(`${sectionLoc(st.s)}: cap terbit "${st.text}" memuat U+2014`);
    else if (!re.test(st.text)) problems.push(`${sectionLoc(st.s)}: cap terbit "${st.text}" tidak cocok ${re.source}`);
  }
  return verdict(problems, `cap terbit "${stamps[0].text}" sesuai format ${ctx.pair.language}`, { location: sectionLoc(stamps[0].s), observed: stamps[0].text });
});

const is02 = defineRule("IS-02", (ctx) => {
  const stamps = issueStamps(ctx);
  if (stamps.length === 0) return fail("cap terbit tidak ditemukan");
  const k = referenceClassification(ctx)?.k;
  const date = registerDate(ctx.docx, interiorRegisters(ctx)[0]);
  const problems: string[] = [];
  let ymd: string | undefined;
  const dm = date ? /^(\d{2})-([IVX]+)-(\d{4})$/.exec(date) : null;
  if (dm && ROMAN_MONTHS.includes(dm[2])) ymd = `${dm[3]}${String(ROMAN_MONTHS.indexOf(dm[2]) + 1).padStart(2, "0")}${dm[1]}`;
  if (!ymd) problems.push(`tanggal register tidak terbaca (${date ?? "tidak ada"}); grup tanggal tidak dapat dibandingkan`);
  if (!k) problems.push("klasifikasi acuan tidak ada; grup kelas tidak dapat dibandingkan");
  for (const st of stamps) {
    const m = /^\/\/\s*(\d{8})\s+(\S+)\s+(\S+)/.exec(st.text);
    if (!m) {
      problems.push(`${sectionLoc(st.s)}: cap terbit "${st.text}" tanpa grup tanggal/bahasa/kelas`);
      continue;
    }
    if (ymd && m[1] !== ymd) problems.push(`${sectionLoc(st.s)}: tanggal ${m[1]} != tanggal register ${ymd}`);
    if (m[2] !== ctx.pair.language) problems.push(`${sectionLoc(st.s)}: bahasa ${m[2]} != ${ctx.pair.language}`);
    if (k && m[3] !== k[0].toUpperCase()) problems.push(`${sectionLoc(st.s)}: kelas ${m[3]} != huruf pertama klasifikasi ${k[0]}`);
  }
  return verdict(problems, `cap terbit konsisten: tanggal ${ymd}, bahasa ${ctx.pair.language}, kelas ${k?.[0] ?? "-"}`);
});

const is03 = defineRule("IS-03", (ctx) => {
  const stamps = issueStamps(ctx);
  if (stamps.length === 0) return fail("cap terbit tidak ditemukan");
  const problems: string[] = [];
  for (const st of stamps) {
    for (const run of ctx.docx.runs(st.p).filter((x) => ctx.docx.runText(x).trim() !== "")) {
      const rp = ctx.docx.effectiveRunProps(run);
      if (!rp.bold || !colorNear(rp.color, COLOR.seal)) problems.push(`${sectionLoc(st.s)}: run cap terbit tebal=${rp.bold} warna=${rp.color ?? "-"}, harapan tebal ${COLOR.seal}`);
    }
  }
  return verdict(problems, `cap terbit tebal ${COLOR.seal}`);
});

const gf01 = defineRule("GF-01", (ctx) => {
  const problems: string[] = [];
  for (const s of ctx.layout.sections) {
    const [w, h] = s.pgSz.orient === "landscape" ? [s.pgSz.h, s.pgSz.w] : [s.pgSz.w, s.pgSz.h];
    if (!near(w, G.pageW, G.pageTol) || !near(h, G.pageH, G.pageTol)) problems.push(`seksi ${s.index}: w:pgSz ${s.pgSz.w}x${s.pgSz.h} (${s.pgSz.orient}), harapan A4 ${G.pageW}x${G.pageH}`);
  }
  return verdict(problems, `${ctx.layout.sections.length} seksi A4 ${G.pageW}x${G.pageH} tw`);
});

const gf02 = defineRule("GF-02", (ctx) => {
  const problems: string[] = [];
  let n = 0;
  for (const s of ctx.layout.sections) {
    if (s.pgSz.orient === "landscape") continue;
    n++;
    const { left, right } = s.pgMar;
    if (!near(left, G.marginLeft, G.marginTol) || !near(right, G.marginRight, G.marginTol))
      problems.push(`seksi ${s.index}: margin kiri/kanan ${left}/${right} tw, harapan ${G.marginLeft}/${G.marginRight}+-${G.marginTol}`);
  }
  return verdict(problems, `${n} seksi tegak bergrid 24 + 166 + 20 mm`);
});

const gf03 = defineRule("GF-03", (ctx) => {
  const interiors = ctx.layout.interiors;
  if (interiors.length === 0) return fail("tidak ada seksi interior");
  const problems: string[] = [];
  for (const s of interiors) {
    const m = s.pgMar;
    const bad: string[] = [];
    if (!near(m.top, G.interiorTop, G.marginTol)) bad.push(`atas ${m.top} (harapan ${G.interiorTop})`);
    if (!near(m.bottom, G.interiorBottom, G.marginTol)) bad.push(`bawah ${m.bottom} (harapan ${G.interiorBottom})`);
    if (!near(m.header, G.interiorHeader, G.hfTol)) bad.push(`header ${m.header} (harapan ${G.interiorHeader})`);
    if (!near(m.footer, G.interiorFooter, G.hfTol)) bad.push(`footer ${m.footer} (harapan ${G.interiorFooter})`);
    if (bad.length) problems.push(`seksi ${s.index}: ${bad.join(", ")}`);
  }
  return verdict(problems, `${interiors.length} seksi interior berbatas tegak 13/26/273/284 mm`);
});

/** Gaya yang dipakai bagian teks (pStyle/rStyle/tblStyle + gaya paragraf bawaan), dengan rantai basedOn. */
function usedStyles(docx: DocxDocument): XmlElement[] {
  const ids = new Set<string>();
  for (const name of docx.textPartNames()) {
    const root = docx.part(name);
    if (!root) continue;
    for (const el of descendants(root, new Set(["w:pStyle", "w:rStyle", "w:tblStyle"]))) {
      const v = attr(el, "w:val");
      if (v) ids.add(v);
    }
  }
  const st = docx.styles;
  if (st) for (const s of children(st, "w:style")) if (attr(s, "w:default") === "1" && attr(s, "w:styleId")) ids.add(attr(s, "w:styleId")!);
  const out = new Map<string, XmlElement>();
  for (const id of ids) for (const s of docx.styleChain(id)) out.set(attr(s, "w:styleId") ?? id, s);
  return [...out.values()];
}

const gf04 = defineRule("GF-04", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  const scan = (where: string, scope: XmlElement | undefined) => {
    if (!scope) return;
    for (const rf of [...(scope.name === "w:rFonts" ? [scope] : []), ...descendants(scope, "w:rFonts")]) {
      for (const slot of ["ascii", "hAnsi", "cs", "eastAsia"]) {
        const direct = attr(rf, `w:${slot}`);
        const themed = attr(rf, `w:${slot}Theme`);
        const name = direct ?? (themed ? docx.themeFont(themed) : undefined);
        if (name && BANNED_FONTS.test(name)) problems.push(`${where}: w:rFonts/@w:${slot} = ${name}`);
      }
    }
  };
  for (const name of docx.textPartNames()) scan(name, docx.part(name));
  scan("styles.xml docDefaults", childPath(docx.styles, "w:docDefaults"));
  for (const s of usedStyles(docx)) scan(`styles.xml gaya ${attr(s, "w:styleId")}`, s);
  return verdict(problems, "tanpa Calibri, Times New Roman, Aptos, atau Arial di teks, docDefaults, dan gaya yang dipakai");
});

const gf05 = defineRule("GF-05", (ctx) => {
  const { docx } = ctx;
  const plex = [...docx.fontsUsed()].filter((f) => f.includes("IBM Plex"));
  if (plex.length === 0) return fail("dokumen tidak merujuk fon IBM Plex");
  const ft = docx.fontTable;
  if (!ft) return fail("word/fontTable.xml tidak ada; fon Plex tidak tertanam");
  const rels = docx.rels("word/fontTable.xml");
  const problems: string[] = [];
  for (const name of plex) {
    const font = descendants(ft, "w:font").find((f) => attr(f, "w:name") === name);
    if (!font) {
      problems.push(`${name}: tidak ada di fontTable.xml`);
      continue;
    }
    const embeds = children(font).filter((c) => /^w:embed(Regular|Bold|Italic|BoldItalic)$/.test(c.name));
    const ok = embeds.some((e) => {
      const rel = rels.get(attr(e, "r:id") ?? "");
      return !!rel?.part && rel.part.startsWith("word/fonts/") && docx.hasPart(rel.part);
    });
    if (!ok) problems.push(`${name}: tanpa w:embed* yang menunjuk bagian word/fonts/ yang ada`);
  }
  return verdict(problems, `${plex.length} fon Plex tertanam: ${plex.join(", ")}`);
});

const CAPTION_START = /^(TABEL|TABLE|GAMBAR|FIGURE|TURUNAN|DERIVATION|SUMBER|SOURCE|PROVENANS|PROVENANCE|KUNCI|KEY)\b/i;

const gf06 = defineRule("GF-06", (ctx) => {
  const { docx } = ctx;
  const content: { p: XmlElement; style: string }[] = [];
  for (const s of ctx.layout.interiors) {
    for (const p of topParas(s)) {
      const text = norm(docx.paragraphText(p, { visible: true }));
      if (!text || outlineOf(docx, p) !== undefined || childPath(p, "w:pPr", "w:numPr")) continue;
      const style = docx.effectiveParaProps(p).styleId ?? "(tanpa pStyle)";
      if (/caption|keterangan/i.test(style) || CAPTION_START.test(text) || CHAPTER_KICKER.test(text)) continue;
      content.push({ p, style });
    }
  }
  if (content.length === 0) return unexercised("tidak ada paragraf isi di seksi interior");
  const byStyle = new Map<string, XmlElement[]>();
  for (const c of content) byStyle.set(c.style, [...(byStyle.get(c.style) ?? []), c.p]);
  const [style, paras] = [...byStyle.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (paras.length * 2 < content.length) return fail(`tidak ada gaya badan mayoritas (terbanyak ${style}: ${paras.length}/${content.length})`);
  // Format efektif gaya badan = format modal run dominan (teks terpanjang) paragraf bergaya itu.
  const tally = new Map<string, number>();
  for (const p of paras) {
    const run = docx.runs(p).sort((a, b) => docx.runText(b).length - docx.runText(a).length)[0];
    const rp = run ? docx.effectiveRunProps(run) : undefined;
    const pp = docx.effectiveParaProps(p);
    const key = JSON.stringify([rp?.fonts.ascii ?? rp?.fonts.hAnsi ?? "", rp?.sz ?? null, pp.spacingLine ?? null, pp.lineRule ?? "auto"]);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  const [modal, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const [font, sz, line, rule] = JSON.parse(modal) as [string, number | null, number | null, string];
  const problems: string[] = [];
  if (!isSerifFont(font)) problems.push(`fon badan ${font || "-"} bukan IBM Plex Serif`);
  if (!near(sz ?? undefined, RUN_SIZE.body, RUN_SIZE.tol)) problems.push(`ukuran badan sz ${sz ?? "-"}, harapan ${RUN_SIZE.body}+-${RUN_SIZE.tol}`);
  if (!near(line ?? undefined, BODY_LINE.line, BODY_LINE.tol) || !BODY_LINE.rules.includes(rule)) problems.push(`spasi baris ${line ?? "-"}/${rule}, harapan ${BODY_LINE.line}+-${BODY_LINE.tol} exact/atLeast`);
  return verdict(problems, `gaya badan ${style} (${paras.length}/${content.length} paragraf isi): ${font}, sz ${sz}, baris ${line}/${rule} (${count}/${paras.length} paragraf)`, {
    observed: `${font} sz ${sz} baris ${line}/${rule}`,
  });
});

const gf07 = defineRule("GF-07", (ctx) => {
  const kickers = chapterKickers(ctx);
  if (kickers.length === 0) return na("tidak ada kicker bab (kicker ditekan di semua bab)");
  const problems: string[] = [];
  for (const { s, p } of kickers) {
    const t = norm(ctx.docx.paragraphText(p, { visible: true }));
    for (const run of ctx.docx.runs(p).filter((x) => ctx.docx.runText(x).trim() !== "")) {
      const rp = ctx.docx.effectiveRunProps(run);
      const bad: string[] = [];
      if (!near(rp.sz, RUN_SIZE.chapterKicker, RUN_SIZE.tol)) bad.push(`sz ${rp.sz ?? "-"}`);
      if (!rp.caps) bad.push("tanpa caps");
      if (!colorNear(rp.color, COLOR.signal)) bad.push(`warna ${rp.color ?? "-"}`);
      if (!isCondFont(rp.fonts.ascii ?? rp.fonts.hAnsi)) bad.push(`fon ${rp.fonts.ascii ?? "-"}`);
      if (bad.length) problems.push(`${sectionLoc(s)} "${t}": ${bad.join(", ")} (harapan sz ${RUN_SIZE.chapterKicker}, caps, ${COLOR.signal}, Cond)`);
    }
  }
  return verdict(problems, `${kickers.length} kicker bab: sz ${RUN_SIZE.chapterKicker}, kapital, ${COLOR.signal}, Plex Cond`);
});

const BORDER_CONTAINERS = new Set(["w:pBdr", "w:tblBorders", "w:tcBorders", "w:pgBorders"]);
const BORDER_EDGES = new Set(["w:top", "w:left", "w:bottom", "w:right", "w:start", "w:end", "w:insideH", "w:insideV", "w:between", "w:bar"]);

const gf09 = defineRule("GF-09", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  let lines = 0;
  for (const name of [...docx.textPartNames(), "word/styles.xml"]) {
    const root = docx.part(name);
    if (!root) continue;
    for (const box of descendants(root, BORDER_CONTAINERS)) {
      for (const edge of children(box)) {
        if (!BORDER_EDGES.has(edge.name) || isNoBorder(edge)) continue;
        lines++;
        const sz = attrNum(edge, "w:sz");
        if (sz === undefined || sz < RULE_SIZE.floor) problems.push(`${name}: ${box.name}/${edge.name} sz ${sz ?? "tanpa sz"} < ${RULE_SIZE.floor}`);
      }
    }
  }
  return verdict(problems, `${lines} garis, semuanya sz >= ${RULE_SIZE.floor} (0,18 mm)`);
});

function tablePctWidth(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  return v.endsWith("%") ? Number(v.slice(0, -1)) * 50 : Number(v);
}

const gf10 = defineRule("GF-10", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  for (const name of docx.textPartNames()) {
    const root = docx.part(name);
    if (!root) continue;
    for (const e of extents(root)) if (e.cx > G.maxExtentEmu) problems.push(`${name}: wp:extent cx ${e.cx} > ${G.maxExtentEmu} EMU`);
    for (const tbl of docx.tables(root)) {
      const tblW = childPath(tbl, "w:tblPr", "w:tblW");
      const type = attr(tblW, "w:type");
      const w = attr(tblW, "w:w");
      if (type === "dxa" && Number(w) > G.maxTableTw) problems.push(`${name}: w:tblW ${w} dxa > ${G.maxTableTw}`);
      if (type === "pct" && (tablePctWidth(w) ?? 0) > G.maxTablePct) problems.push(`${name}: w:tblW ${w} pct > ${G.maxTablePct}`);
      const grid = docx.gridCols(tbl).reduce((a, b) => a + b, 0);
      if (grid > G.maxTableTw) problems.push(`${name}: jumlah w:gridCol ${grid} > ${G.maxTableTw}`);
    }
  }
  return verdict(problems, `tidak ada gambar atau tabel lebih lebar dari 166 mm`);
});

/** Datum Rule = gambar garis tipis (tinggi <= 5 mm, rasio >= 20:1). */
const isRuleGraphic = (e: { cx: number; cy: number }): boolean => e.cy <= 180_000 && e.cx >= 20 * Math.max(e.cy, 1);

const gf11 = defineRule("GF-11", (ctx) => {
  const problems: string[] = [];
  let figures = 0;
  for (const s of ctx.layout.interiors) {
    for (const blk of s.blocks) {
      for (const e of extents(blk)) {
        if (isRuleGraphic(e)) continue;
        figures++;
        if (!G.figureWidthsEmu.some((w) => near(e.cx, w, G.emuTol))) problems.push(`${sectionLoc(s)}: gambar cx ${e.cx} EMU, harapan ${G.figureWidthsEmu.join(" atau ")}+-${G.emuTol}`);
      }
    }
  }
  if (figures === 0) return na("tidak ada gambar isi di seksi interior");
  return verdict(problems, `${figures} gambar isi selebar 128 atau 166 mm`);
});

const gf12 = defineRule("GF-12", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  for (const name of docx.partNames()) {
    const lower = name.toLowerCase();
    if (!(lower.endsWith(".xml") || lower.endsWith(".rels") || (lower.startsWith("word/media/") && lower.endsWith(".svg")))) continue;
    const xml = docx.partXml(name)?.toUpperCase();
    if (!xml) continue;
    for (const hex of RETIRED_COLORS) if (xml.includes(hex)) problems.push(`${name}: memuat warna pensiun ${hex}`);
  }
  return verdict(problems, `warna pensiun ${RETIRED_COLORS.join(", ")} tidak ada di bagian XML dan SVG`);
});

const gf13 = defineRule("GF-13", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  const check = (where: string, run: XmlElement) => {
    const rp = docx.effectiveRunProps(run);
    if (!rp.bold || !colorNear(rp.color, COLOR.seal)) problems.push(`${where}: klasifikasi tebal=${rp.bold} warna=${rp.color ?? "-"}, harapan tebal ${COLOR.seal}`);
  };
  let n = 0;
  for (const { s, head } of interiorHeads(ctx)) {
    const where = `header ${head?.part ?? "-"} (${sectionLoc(s)})`;
    if (!head || head.rightRuns.length === 0) problems.push(`${where}: run klasifikasi kanan tidak ada`);
    for (const run of head?.rightRuns ?? []) {
      n++;
      check(where, run);
    }
  }
  for (const reg of interiorRegisters(ctx)) {
    const where = `register ${reg.part ?? "-"} (${sectionLoc(reg.s)})`;
    const c4 = reg.cells[3];
    if (!c4) {
      problems.push(`${where}: sel ke-4 tidak ada`);
      continue;
    }
    for (const run of textRuns(docx, c4)) {
      n++;
      check(where, run);
    }
  }
  if (ctx.layout.interiors.length === 0) return fail("tidak ada seksi interior");
  return verdict(problems, `${n} run klasifikasi (kepala halaman, register) tebal ${COLOR.seal}`);
});

const gf14 = defineRule("GF-14", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  let chapters = 0;
  for (const s of ctx.layout.interiors) {
    const headings = docx.paragraphs(s.blocks).filter((p) => outlineOf(docx, p) !== undefined);
    const ch = headings.filter((p) => outlineOf(docx, p) === 0);
    chapters += ch.length;
    if (ch.length > 1) problems.push(`${sectionLoc(s)}: ${ch.length} judul bab dalam satu seksi`);
    if (ch.length >= 1 && headings[0] !== ch[0]) problems.push(`${sectionLoc(s)}: judul bab "${norm(docx.paragraphText(ch[0]))}" bukan judul pertama seksi`);
  }
  if (chapters === 0 && problems.length === 0) return unexercised("tidak ada judul bab (outline 0) di seksi interior");
  return verdict(problems, `${chapters} judul bab masing-masing membuka seksi Word sendiri`);
});

const gf15 = defineRule("GF-15", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  for (const p of docx.paragraphs(docx.body)) {
    const lvl = outlineOf(docx, p);
    if (lvl !== undefined && lvl >= 3) problems.push(`paragraf "${norm(docx.paragraphText(p)).slice(0, 40)}" outline ${lvl} (tingkat ${lvl + 1})`);
  }
  const used = new Set(docx.paragraphs(docx.body).map((p) => docx.effectiveParaProps(p).styleId).filter((x): x is string => !!x));
  for (const id of used) {
    const name = attr(child(docx.styleById(id), "w:name"), "w:val") ?? "";
    if (/^heading ?[4-9]$/i.test(name) || /^Heading[4-9]$/.test(id)) problems.push(`gaya ${id} (${name}) dipakai`);
  }
  return verdict(problems, "judul bernomor paling dalam tiga tingkat (tanpa outline >= 3, tanpa Heading 4-9)");
});

const dv01 = defineRule("DV-01", (ctx) => {
  const { docx } = ctx;
  const problems: string[] = [];
  let chapters = 0;
  for (const s of ctx.layout.interiors) {
    const ch = chapterOf(docx, s);
    if (!ch) continue;
    chapters++;
    const before = topParas(s).slice(0, ch.headingIdx);
    if (!before.some((p) => extents(p).some((e) => near(e.cx, G.datumRuleEmu, G.emuTol)))) problems.push(`${sectionLoc(s)}: tanpa Datum Rule (cx ${G.datumRuleEmu}) sebelum judul bab "${ch.title}"`);
  }
  if (chapters === 0) return unexercised("tidak ada seksi interior yang membuka bab");
  return verdict(problems, `Datum Rule ${G.datumRuleEmu} EMU di atas ${chapters} judul bab`);
});

export const rules: readonly Rule[] = [
  cr1,
  rh01,
  rh03,
  rh04,
  rb01,
  rb02,
  rb03,
  rb04,
  rb05,
  rb06,
  rb07,
  rb08,
  sb01,
  sb02,
  sb03,
  is01,
  is02,
  is03,
  gf01,
  gf02,
  gf03,
  gf04,
  gf05,
  gf06,
  gf07,
  gf09,
  gf10,
  gf11,
  gf12,
  gf13,
  gf14,
  gf15,
  dv01,
];
