/**
 * S20: klasifikasi seksi R0 (research/32 §0.4) yang dipakai bersama modul aturan S21-S23.
 *
 * - SAMPUL = seksi pertama yang memuat tabel pita segel.
 * - INTERIOR = seksi yang footer default-nya memuat medan PAGE.
 * - PEMBUNGKUS = seksi sebelum seksi interior pertama.
 * - LEMBAR KENDALI = seksi pembungkus dengan kicker `Lembar Kendali` / `Control Sheet` (research/31 §4.2).
 * - DAFTAR ISI = seksi pembungkus yang memuat medan TOC.
 */
import type { DocxDocument, Section } from "./docx";
import { attr, childPath, type XmlElement } from "./xml";

export const SEAL_HEX = "6E1420";
export const CONTROL_SHEET_KICKERS: readonly string[] = ["Lembar Kendali", "Control Sheet"];

export type SectionClass = "cover" | "wrapper" | "controlSheet" | "toc" | "interior";

export interface ClassifiedSection extends Section {
  readonly classes: ReadonlySet<SectionClass>;
}

export interface DocLayout {
  readonly sections: readonly ClassifiedSection[];
  readonly cover?: ClassifiedSection;
  readonly controlSheet?: ClassifiedSection;
  readonly toc?: ClassifiedSection;
  readonly wrappers: readonly ClassifiedSection[];
  readonly interiors: readonly ClassifiedSection[];
  /** Indeks seksi interior pertama, -1 bila tidak ada. */
  readonly firstInteriorIndex: number;
  /** Semua tabel pita segel di body, dalam urutan dokumen. */
  readonly sealBandTables: readonly XmlElement[];
  /** Tabel register per bagian footer (hanya footer yang memuatnya). */
  readonly registerTables: ReadonlyMap<string, XmlElement>;
}

/** Banding warna hex dengan toleransi per kanal (R0 "Warna"); `auto`/absen = tidak cocok. */
export function colorNear(actual: string | undefined, expected: string, tol = 3): boolean {
  if (!actual || !/^[0-9a-fA-F]{6}$/.test(actual) || !/^[0-9a-fA-F]{6}$/.test(expected)) return false;
  for (let k = 0; k < 6; k += 2) {
    if (Math.abs(parseInt(actual.slice(k, k + 2), 16) - parseInt(expected.slice(k, k + 2), 16)) > tol) return false;
  }
  return true;
}

function shape(doc: DocxDocument, tbl: XmlElement): number[] {
  return doc.tableRows(tbl).map((tr) => doc.rowCells(tr).length);
}

/** Tabel pita segel: 1 baris x 2 sel, isian sel ~ 6E1420. */
export function isSealBandTable(doc: DocxDocument, tbl: XmlElement): boolean {
  const s = shape(doc, tbl);
  if (s.length !== 1 || s[0] !== 2) return false;
  const cells = doc.rowCells(doc.tableRows(tbl)[0]);
  return cells.some((tc) => colorNear(attr(childPath(tc, "w:tcPr", "w:shd"), "w:fill"), SEAL_HEX));
}

/** Tabel register: 1 baris x 4 sel (dipakai di footer). */
export function isRegisterTable(doc: DocxDocument, tbl: XmlElement): boolean {
  const s = shape(doc, tbl);
  return s.length === 1 && s[0] === 4;
}

function hasField(doc: DocxDocument, scope: XmlElement | readonly XmlElement[], re: RegExp): boolean {
  return doc.fieldInstructions(scope).some((f) => re.test(f.instr));
}

export function buildLayout(doc: DocxDocument): DocLayout {
  const secs = doc.sections();
  const sealBandTables: XmlElement[] = [];
  const registerTables = new Map<string, XmlElement>();
  const interiorFlags = secs.map((s) => {
    const f = s.footers.default;
    const root = f ? doc.part(f) : undefined;
    return root ? hasField(doc, root, /^PAGE\b/) : false;
  });
  const firstInteriorIndex = interiorFlags.indexOf(true);
  const out: ClassifiedSection[] = [];
  let coverSeen = false;
  secs.forEach((s, i) => {
    const classes = new Set<SectionClass>();
    const bands = doc.tables(s.blocks).filter((t) => isSealBandTable(doc, t));
    sealBandTables.push(...bands);
    const isWrapper = firstInteriorIndex < 0 ? true : i < firstInteriorIndex;
    if (interiorFlags[i]) classes.add("interior");
    if (isWrapper) classes.add("wrapper");
    if (!coverSeen && bands.length > 0) {
      classes.add("cover");
      coverSeen = true;
    } else if (isWrapper) {
      const texts = doc.paragraphs(s.blocks).map((p) => doc.paragraphText(p).trim());
      if (texts.some((t) => CONTROL_SHEET_KICKERS.some((k) => t === k || t.startsWith(`${k} `)))) classes.add("controlSheet");
      if (hasField(doc, s.blocks, /^TOC\b/)) classes.add("toc");
    }
    out.push({ ...s, classes });
  });
  for (const f of doc.footerParts()) {
    const root = doc.part(f);
    const t = root ? doc.tables(root).find((x) => isRegisterTable(doc, x)) : undefined;
    if (t) registerTables.set(f, t);
  }
  return {
    sections: out,
    cover: out.find((s) => s.classes.has("cover")),
    controlSheet: out.find((s) => s.classes.has("controlSheet")),
    toc: out.find((s) => s.classes.has("toc")),
    wrappers: out.filter((s) => s.classes.has("wrapper")),
    interiors: out.filter((s) => s.classes.has("interior")),
    firstInteriorIndex,
    sealBandTables,
    registerTables,
  };
}
