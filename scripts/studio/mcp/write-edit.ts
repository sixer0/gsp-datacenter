/**
 * IMPL-W `studio_edit` (D-521/D-522): sunting bergaya patch atas teks Markdown bagian dokumen (hasil serialisasi
 * server yang sama dengan `studio_report_refresh`). Satuan sunting = paragraf, sel tabel, atau medan record (baris
 * `Kunci: nilai`). `find` dicocokkan sebagai substring persis dengan spasi dinormalkan dan harus mengenai tepat satu
 * satuan (sekali); selain itu TEXT_NOT_FOUND / TEXT_AMBIGUOUS dengan kandidat terdekat. Murni: tanpa I/O.
 */
import type { ReportPartMarkdown } from "../../../src/lib/studio/services/draft/md-report";
import { McpToolError } from "./safety";
import type { ToolWarning } from "./tool-kit";
import { blockLines, cellText, expectedParagraphs, guardLine, isRows, itemStatusOf, paragraphLines, stableKey, type Block, type Cell } from "./write-content";
import { exactView, findCell, findSection, findText, fold, notAppliedOf, spansHaveMarkup, spliceSpans, type MatchUnit, type NotApplied, type Tier } from "./write-match";

export type Region = keyof ReportPartMarkdown;
export interface EditPart {
  part: string;
  md: ReportPartMarkdown;
}
export type EditOp =
  | { find: string; replace: string; section?: string; occurrence?: "all"; target?: { plain: string; nth: number } }
  | { after: string; insert: string; section?: string }
  | { cell: { section?: string; row: string; column: string }; value: string }
  | { section: string; append: Block[] }
  | { section: string; addRow: Cell[][]; table?: number | string };

export interface Unit {
  part: number;
  region: Region;
  kind: "field" | "paragraph" | "cell";
  /** IMPL-W3: judul `##` terakhir sebelum satuan ("" = kepala/record). */
  section: string;
  /** sel: teks semua sel baris ini, judul kolom, dan apakah baris judul tabel. */
  rowCells?: string[];
  column?: string;
  headerRow?: boolean;
  /** baris awal..akhir (eksklusif) di region; sel = satu baris. */
  start: number;
  end: number;
  /** akhir blok (tabel utuh untuk sel) untuk sisipan `after`. */
  blockEnd: number;
  cell?: number;
  text: string;
}

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const TABLE_SEP_RE = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const FIELD_RE = /^([A-Za-z][A-Za-z ]{0,40}):\s?(.*)$/;

export function splitRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  return t.split(/(?<!\\)\|/).map((c) => c.trim());
}
const joinRow = (cells: string[]) => `| ${cells.join(" | ")} |`;

/** Satuan sunting satu region. */
function regionUnits(lines: string[], part: number, region: Region): Unit[] {
  const out: Unit[] = [];
  if (region === "header") {
    lines.forEach((l, i) => {
      const m = FIELD_RE.exec(l);
      if (m) out.push({ part, region, kind: "field", section: "", start: i, end: i + 1, blockEnd: i + 1, text: m[2] });
    });
    return out;
  }
  let section = "";
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) section = h[1].replace(/\\(?=[\p{P}\p{S}])/gu, "").trim();
    if (l.trim() === "" || h) {
      i++;
      continue;
    }
    const fence = FENCE_RE.exec(l);
    if (fence) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith(fence[1])) j++;
      const end = Math.min(j + 1, lines.length);
      out.push({ part, region, kind: "paragraph", section, start: i, end, blockEnd: end, text: lines.slice(i, end).join("\n") });
      i = end;
      continue;
    }
    if (l.trimStart().startsWith("|")) {
      let j = i;
      while (j < lines.length && lines[j].trimStart().startsWith("|")) j++;
      const unpipe = (c: string) => c.replace(/\\\|/g, "|");
      const header = splitRow(lines[i]).map(unpipe);
      for (let r = i; r < j; r++) {
        if (TABLE_SEP_RE.test(lines[r].trim())) continue;
        const rowCells = splitRow(lines[r]).map(unpipe);
        rowCells.forEach((c, ci) => out.push({ part, region, kind: "cell", section, rowCells, column: header[ci] ?? "", headerRow: r === i, start: r, end: r + 1, blockEnd: j, cell: ci, text: c }));
      }
      i = j;
      continue;
    }
    let j = i;
    while (j < lines.length && lines[j].trim() !== "" && !/^#{1,6}\s/.test(lines[j]) && !lines[j].trimStart().startsWith("|") && !FENCE_RE.test(lines[j])) j++;
    out.push({ part, region, kind: "paragraph", section, start: i, end: j, blockEnd: j, text: lines.slice(i, j).join("\n") });
    i = j;
  }
  return out;
}

export function unitsOf(parts: readonly EditPart[]): Unit[] {
  const out: Unit[] = [];
  parts.forEach((p, pi) => {
    for (const r of ["header", "intro", "body", "tail"] as const) out.push(...regionUnits(p.md[r], pi, r));
  });
  return out;
}

/** Spasi dinormalkan + peta indeks ke teks asli. */
export function normalize(s: string): { text: string; map: number[] } {
  let text = "";
  const map: number[] = [];
  let space = false;
  for (let i = 0; i < s.length; i++) {
    if (/\s/.test(s[i])) {
      space = text.length > 0;
      continue;
    }
    if (space) {
      text += " ";
      map.push(i - 1);
      space = false;
    }
    text += s[i];
    map.push(i);
  }
  return { text, map };
}

/** Proyeksi tanpa markah inline (tautan -> teks, ** __ * _ ` dibuang) untuk pencocokan cadangan. */
export const PLAIN_MAX = 20_000;
/**
 * L-3 (review 13): pemindai linear (tanpa regex berbacktracking pada `[`), masukan dibatasi {@link PLAIN_MAX}
 * karakter. Tautan `[teks](url)` / `![teks](url)` -> teks; `*`, `` ` `` dibuang; `_` dibuang bila tidak di antara huruf/angka.
 */
export function plainOf(s: string): string {
  const src = s.length > PLAIN_MAX ? s.slice(0, PLAIN_MAX) : s;
  const word = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);
  // Posisi `)` dan baris baru berikutnya untuk setiap indeks, satu lintasan mundur (tetap linear).
  const nextClose = new Int32Array(src.length + 1).fill(-1);
  const nextNl = new Int32Array(src.length + 1).fill(-1);
  for (let k = src.length - 1; k >= 0; k--) {
    nextClose[k] = src[k] === ")" ? k : nextClose[k + 1];
    nextNl[k] = src[k] === "\n" ? k : nextNl[k + 1];
  }
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "!" && src[i + 1] === "[") {
      i++;
      continue;
    }
    if (c === "]" && src[i + 1] === "(") {
      const close = nextClose[i + 2] ?? -1;
      const nl = nextNl[i + 2] ?? -1;
      if (close >= 0 && (nl < 0 || close < nl)) {
        i = close + 1;
        continue;
      }
    }
    if (c === "[" || c === "]" || c === "*" || c === "`") {
      i++;
      continue;
    }
    if (c === "_" && !(word(src[i - 1]) && word(src[i + 1]))) {
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Satuan paragraf yang sebenarnya blok kode berpagar. */
const isFence = (u: Unit): boolean => u.kind === "paragraph" && FENCE_RE.test(u.text);

/** Satuan laporan kerja -> satuan pencocokan bersama (IMPL-W3, `write-match.ts`). */
export function matchUnitsOf(units: readonly Unit[], parts: readonly EditPart[]): MatchUnit[] {
  return units.map((u) => ({
    text: u.text,
    section: u.region === "header" ? "record" : u.section,
    part: parts[u.part].part,
    kind: u.kind,
    // W3-L3: blok kode berpagar tidak pernah dicocokkan lewat proyeksi tanpa markah (itu menulis ulang blok sebagai paragraf).
    ...(isFence(u) ? { noPlain: true } : {}),
    ...(u.rowCells !== undefined ? { rowCells: u.rowCells, column: u.column ?? "", headerRow: u.headerRow === true } : {}),
  }));
}

export interface Hit {
  unit: Unit;
  /** rentang asli [awal, akhir) di unit.text; null = cocok lewat proyeksi tanpa markah. */
  spans: Array<[number, number]> | null;
  tier: Tier;
}

/** Satuan untuk `find`/`after` (persis -> tanpa markah -> samar; dibatasi section; semua bila `all`). */
export function locate(find: string, parts: readonly EditPart[], label: string, opts: { section?: string; all?: boolean } = {}): Hit[] {
  const units = unitsOf(parts);
  const { hits } = findText(find, matchUnitsOf(units, parts), opts, label);
  return hits.map((h) => ({ unit: units[h.index], spans: h.spans, tier: h.tier }));
}

/** Rencana suntingan untuk cek struktur pasca-konversi (R-1 siklus 2). */
export interface EditPlan {
  /** medan record (nama kontrak) yang disunting lewat satuan medan kepala. */
  fields: Set<string>;
  /** ada sel tabel bab yang disunting (butir/bukti record boleh berubah). */
  itemCells: boolean;
  /** ada sel tabel Rujukan yang disunting (record.refs boleh berubah). */
  refCells: boolean;
  /** per bagian: paragraf yang boleh hilang/berubah (jumlah suntingan paragraf) dan selisih jumlah blok yang diharapkan. */
  paraDelta: Map<string, { removedMax: number; delta: number }>;
  /** IMPL-W5 E1: blok yang ditambahkan `append` per bagian: indeks section (-1 = pembuka bab), jenis blok bukan paragraf, teks paragraf. */
  appended?: Map<string, Array<{ section: number; kinds: string[]; paras: string[] }>>;
}

const FIELD_NAMES: Readonly<Record<string, string>> = { status: "status", owner: "owner", reportedat: "reportedAt", verdict: "verdict", initiator: "initiator", taskref: "taskRef", cardids: "cardIds" };
const LIST_MARKER_RE = /^((?:[-*+]|\d{1,9}[.)]|>)\s+)(.*)$/;
/** Kolom kunci tabel butir (sama dengan importer kontrak `ITEM_KEY_COLUMNS`). */
const ITEM_KEY_COLUMNS = new Set(["id", "kartu", "card", "key"]);

/** Baris yang berubah dijaga ulang; penanda daftar/kutipan di awal dipertahankan, isinya lewat guardLine. */
function guardChanged(line: string): string {
  if (line.trim() === "") return line;
  const m = LIST_MARKER_RE.exec(line.replace(/^\s+/, ""));
  return m ? `${m[1]}${guardLine(m[2])}` : guardLine(line);
}

/**
 * R-1 (siklus 2): sesudah SEMUA suntingan, setiap baris region intro/body/tail yang tidak ada di teks semula (multiset;
 * baris tabel hasil suntingan sel = tepercaya) dijaga ulang dengan guardLine, sehingga escape yang dilepas suntingan
 * bertahap (`find` memuat `\`, `replace` tanpa) kembali. Baris di dalam pagar kode yang ada dibiarkan (isi kode).
 */
function reguard(parts: EditPart[], snapshot: ReadonlyArray<Record<Region, string[]>>, trusted: ReadonlyArray<Map<string, number>>): void {
  parts.forEach((p, pi) => {
    for (const r of ["intro", "body", "tail"] as const) {
      const left = new Map<string, number>();
      for (const l of snapshot[pi][r]) left.set(l, (left.get(l) ?? 0) + 1);
      const ok = new Map(trusted[pi]);
      let fence: string | null = null;
      p.md[r] = p.md[r].map((l) => {
        let out = l;
        if ((left.get(l) ?? 0) > 0) left.set(l, (left.get(l) as number) - 1);
        else if ((ok.get(l) ?? 0) > 0) ok.set(l, (ok.get(l) as number) - 1);
        else {
          const marker = FENCE_RE.exec(l);
          if (fence === null || marker !== null) out = guardChanged(l);
        }
        const f = FENCE_RE.exec(out);
        if (f) fence = fence === null ? f[1][0] : f[1][0] === fence ? null : fence;
        return out;
      });
    }
  });
}

/** IMPL-W5: section (judul `#..######`) per bagian dan region: baris judul + akhir (eksklusif). Record tidak bersection. */
interface SecRef {
  part: number;
  region: Region;
  head: number;
  end: number;
  title: string;
  /** urutan section di bagian itu (cocok dengan `chapter.sections[ordinal]`). */
  ordinal: number;
}
function sectionsOf(parts: readonly EditPart[]): SecRef[] {
  const out: SecRef[] = [];
  parts.forEach((p, pi) => {
    if (p.part === "record") return;
    let ordinal = 0;
    for (const region of ["intro", "body", "tail"] as const) {
      const lines = p.md[region];
      const heads = lines.map((l, i) => (/^#{1,6}\s+/.test(l) ? i : -1)).filter((i) => i >= 0);
      heads.forEach((h, k) => out.push({ part: pi, region, head: h, end: heads[k + 1] ?? lines.length, title: lines[h].replace(/^#{1,6}\s+/, "").replace(/\\(?=[\p{P}\p{S}])/gu, "").trim(), ordinal: ordinal++ }));
    }
  });
  return out;
}

/** IMPL-W5 E2: tabel di dalam section (baris berawalan `|` berurutan) + keterangan (paragraf sesudahnya). */
interface TableRef {
  start: number;
  end: number;
  header: string[];
  caption: string;
}
function tablesIn(lines: readonly string[], from: number, to: number): TableRef[] {
  const out: TableRef[] = [];
  let i = from;
  while (i < to) {
    if (!lines[i].trimStart().startsWith("|")) {
      i++;
      continue;
    }
    let j = i;
    while (j < to && lines[j].trimStart().startsWith("|")) j++;
    let c = j;
    while (c < to && lines[c].trim() === "") c++;
    const caption = c < to && !lines[c].trimStart().startsWith("|") && !/^#{1,6}\s/.test(lines[c]) ? exactView(lines[c]).text : "";
    out.push({ start: i, end: j, header: splitRow(lines[i]).map((x) => x.replace(/\\\|/g, "|")), caption });
    i = j;
  }
  return out;
}

/** Jenis blok bukan paragraf + teks paragraf yang dihasilkan satu blok append (sama dengan susunan `studio_write`). */
function blockShape(b: Block): { kinds: string[]; paras: string[] } {
  const paras = expectedParagraphs(b);
  if (typeof b === "string") return { kinds: [], paras };
  if (isRows(b)) return { kinds: ["table"], paras };
  const o = b as unknown as Record<string, unknown>;
  if (isRows(o.table) || (o.chart !== null && typeof o.chart === "object")) return { kinds: ["table"], paras };
  if (Array.isArray(o.list)) return { kinds: ["list"], paras };
  return { kinds: [], paras };
}

export interface ApplyOptions {
  /** IMPL-W5 E5: status butir tersimpan (kunci huruf kecil -> kode); status tak terpetakan memakai status ini. */
  prevItemStatus?: ReadonlyMap<string, string>;
}

/**
 * Terapkan suntingan berurutan (setiap suntingan melihat hasil sebelumnya). Mengembalikan bagian tersentuh + rencana.
 * IMPL-W5 E3: alamat (sel, jangkar `after`, section append/addRow) dicari di keadaan sesudah suntingan sebelumnya di
 * batch ini; tidak ketemu -> dicari di isi tersimpan lalu dipetakan ke blok yang sama (identitas baris dilacak). E4:
 * galat alamat (TEXT_NOT_FOUND/TEXT_AMBIGUOUS) tidak menggagalkan batch; suntingan itu masuk `notApplied`.
 */
export function applyEdits(parts: EditPart[], edits: readonly EditOp[], warn: (w: ToolWarning) => void, opts: ApplyOptions = {}): { touched: Set<number>; plan: EditPlan; notApplied: NotApplied[]; errors: unknown[] } {
  const touched = new Set<number>();
  const plan: EditPlan = { fields: new Set(), itemCells: false, refCells: false, paraDelta: new Map(), appended: new Map() };
  const notApplied: NotApplied[] = [];
  const errors: unknown[] = [];
  const delta = (pi: number, removed: number, d: number) => {
    const k = parts[pi].part;
    const cur = plan.paraDelta.get(k) ?? { removedMax: 0, delta: 0 };
    plan.paraDelta.set(k, { removedMax: cur.removedMax + removed, delta: cur.delta + d });
  };
  const snapshot = parts.map((p) => ({ header: [...p.md.header], intro: [...p.md.intro], body: [...p.md.body], tail: [...p.md.tail] }));
  const stored: EditPart[] = parts.map((p, i) => ({ part: p.part, md: snapshot[i] }));
  const trusted = parts.map(() => new Map<string, number>());
  const trust = (pi: number, line: string) => trusted[pi].set(line, (trusted[pi].get(line) ?? 0) + 1);
  // E3: identitas baris (indeks baris tersimpan; -1 = baris baru) agar alamat di isi tersimpan dapat dipetakan ke keadaan kini.
  const ids = parts.map((p) => ({ header: p.md.header.map((_, i) => i), intro: p.md.intro.map((_, i) => i), body: p.md.body.map((_, i) => i), tail: p.md.tail.map((_, i) => i) }));
  const splice = (pi: number, region: Region, start: number, del: number, add: readonly string[], keepFirst = false) => {
    const first = ids[pi][region][start];
    parts[pi].md[region].splice(start, del, ...add);
    ids[pi][region].splice(start, del, ...add.map((_, k) => (k === 0 && keepFirst && del > 0 ? first : -1)));
  };
  /** Satuan di isi tersimpan -> satuan yang sama di keadaan kini (null bila bloknya sudah dihapus). */
  const remap = (su: Unit): Unit | null => {
    const at = ids[su.part][su.region].indexOf(su.start);
    if (at < 0) return null;
    return unitsOf(parts).find((u) => u.part === su.part && u.region === su.region && u.start === at && u.kind === su.kind && u.cell === su.cell) ?? null;
  };
  /** E3: cari di keadaan kini; TEXT_NOT_FOUND -> cari di isi tersimpan lalu petakan; selain itu galat asli. */
  const resolve = <T>(find: (ps: readonly EditPart[]) => T, map: (t: T) => T | null, label: string): T => {
    try {
      return find(parts);
    } catch (e) {
      if (!(e instanceof McpToolError) || e.code !== "TEXT_NOT_FOUND" || !changed) throw e;
      let t: T;
      try {
        t = find(stored);
      } catch {
        throw e;
      }
      const m = map(t);
      if (m === null) throw e;
      warn({ code: "ADDRESS_FROM_STORED", message: `${label}: alamat tidak ada lagi sesudah suntingan sebelumnya di batch ini; dipetakan dari isi tersimpan ke blok yang sama` });
      return m;
    }
  };
  const secResolve = (target: string, label: string): SecRef =>
    resolve(
      (ps) => {
        const all = sectionsOf(ps);
        return all[findSection(target, all.map((s) => ({ title: s.title, part: ps[s.part].part })), label)];
      },
      (s) => {
        const at = ids[s.part][s.region].indexOf(s.head);
        return at < 0 ? null : (sectionsOf(parts).find((x) => x.part === s.part && x.region === s.region && x.head === at) ?? null);
      },
      label,
    );
  let changed = false;
  const cellSet = (u: Unit, next: string) => {
    const lines = parts[u.part].md[u.region];
    const cells = splitRow(lines[u.start]);
    cells[u.cell as number] = cellText(next);
    lines[u.start] = joinRow(cells);
    trust(u.part, lines[u.start]);
    if (u.region === "tail") plan.refCells = true;
    else plan.itemCells = true;
    touched.add(u.part);
  };
  /** Kunci butir yang sudah dipakai (tabel butir semua bagian + record tersimpan), untuk kunci baru tanpa bentrok. */
  const usedKeys = (): Set<string> => {
    const used = new Set<string>([...(opts.prevItemStatus?.keys() ?? [])]);
    for (const u of unitsOf(parts)) if (u.kind === "cell" && u.headerRow !== true && ITEM_KEY_COLUMNS.has((u.column ?? "").trim().toLowerCase()) && u.text.trim() !== "") used.add(u.text.trim().toLowerCase());
    return used;
  };
  const applyOne = (e: EditOp, label: string): void => {
    if ("append" in e) {
      // IMPL-W5 E1: blok di akhir section, urut; susunan + escape sama dengan studio_write (blockLines).
      const sec = secResolve(e.section, label);
      const pname = parts[sec.part].part;
      if (pname === "references") throw new McpToolError("EDIT_INVALID", `${label}: append tidak berlaku untuk bagian Rujukan; pakai addRow. Tidak ada yang ditulis`);
      const lines = parts[sec.part].md[sec.region];
      let at = sec.end;
      while (at > sec.head + 1 && lines[at - 1].trim() === "") at--;
      const used = usedKeys();
      const add: string[] = [];
      const kinds: string[] = [];
      const paras: string[] = [];
      let blocks = 0;
      e.append.forEach((b, k) => {
        const bl = blockLines(b, warn, `${label} blok ${k + 1}`, used, opts.prevItemStatus);
        if (bl.length === 0) return;
        add.push("", ...bl);
        const shape = blockShape(b);
        kinds.push(...shape.kinds);
        paras.push(...shape.paras);
        blocks += shape.kinds.length + shape.paras.length;
        if (shape.kinds.includes("table")) plan.itemCells = true;
      });
      if (add.length === 0) throw new McpToolError("EDIT_INVALID", `${label}: append tanpa isi; tidak ada yang ditulis`);
      for (const l of add) trust(sec.part, l);
      splice(sec.part, sec.region, at, 0, [...add, ""]);
      delta(sec.part, 0, blocks);
      plan.appended?.set(pname, [...(plan.appended.get(pname) ?? []), { section: sec.ordinal, kinds, paras }]);
      touched.add(sec.part);
      return;
    }
    if ("addRow" in e) {
      // IMPL-W5 E2: baris baru di tabel section (bawaan tabel terakhir); lebar = jumlah kolom tabel.
      const sec = secResolve(e.section, label);
      const lines = parts[sec.part].md[sec.region];
      const tables = tablesIn(lines, sec.head + 1, sec.end);
      const t = pickTable(tables, e.table, label);
      const bad = e.addRow.findIndex((r) => r.length !== t.header.length);
      if (bad >= 0) throw new McpToolError("EDIT_INVALID", `${label}: baris ${bad + 1} berisi ${e.addRow[bad].length} sel, tabel ${t.header.length} kolom; tidak ada yang ditulis. Judul kolom ada di blok rincian`, { untrusted: true, details: { edit: label, expectedHeader: t.header } });
      const head = t.header.map((h) => h.trim().toLowerCase());
      const keyIdx = head.findIndex((h) => ITEM_KEY_COLUMNS.has(h));
      const titleIdx = head.findIndex((h) => h === "judul" || h === "title");
      const items = keyIdx >= 0 && head.includes("status");
      const used = items ? usedKeys() : new Set<string>();
      const generated: string[] = [];
      const rows = e.addRow.map((r) => {
        const cells = r.map((c) => String(c ?? "").replace(/\s+/g, " ").trim());
        if (items && cells[keyIdx] === "") {
          let k = stableKey(titleIdx >= 0 && cells[titleIdx] !== "" ? cells[titleIdx] : cells.filter((_, j) => j !== keyIdx).join(" "));
          for (let n = 2; used.has(k.toLowerCase()); n++) k = `${k.replace(/-\d+$/, "")}-${n}`;
          used.add(k.toLowerCase());
          cells[keyIdx] = k;
          generated.push(k);
        }
        return joinRow(cells.map(cellText));
      });
      if (generated.length > 0) warn({ code: "ITEM_KEY_GENERATED", message: `${label}: ${generated.length} butir tanpa kunci diberi kunci stabil (${generated.slice(0, 5).join(", ")})` });
      for (const l of rows) trust(sec.part, l);
      splice(sec.part, sec.region, t.end, 0, rows);
      if (sec.region === "tail") plan.refCells = true;
      else plan.itemCells = true;
      touched.add(sec.part);
      return;
    }
    if ("cell" in e) {
      // IMPL-W3: sel tabel struktural (row = teks sel mana pun di baris, column = judul kolom), tepat satu sel.
      const u = resolve((ps) => {
        const units = unitsOf(ps);
        return units[findCell(e.cell, matchUnitsOf(units, ps), label)];
      }, remap, label);
      cellSet(u, e.value);
      return;
    }
    if ("insert" in e) {
      const h = resolve((ps) => locate(e.after, ps, label, { ...(e.section !== undefined ? { section: e.section } : {}) })[0], (x) => {
        const u = remap(x.unit);
        return u === null ? null : { ...x, unit: u };
      }, label);
      if (h.unit.kind === "field") throw new McpToolError("INVALID_ARGUMENT", `${label}: after menunjuk medan record; sisipan hanya sesudah paragraf atau tabel`);
      const add = e.insert.trim() === "" ? [] : paragraphLines(e.insert.trim(), warn, label);
      if (add.length === 0) throw new McpToolError("INVALID_ARGUMENT", `${label}: insert kosong`);
      splice(h.unit.part, h.unit.region, h.unit.blockEnd, 0, ["", ...add, ""]);
      delta(h.unit.part, 0, e.insert.trim().split(/\n\s*\n/).filter((x) => x.trim() !== "").length);
      touched.add(h.unit.part);
      return;
    }
    if (e.target !== undefined) {
      // W3-L1 (internal, dari suntingan posisi): satuan = paragraf ke-nth di bab itu yang teks polosnya sama dengan
      // paragraf ber-pid; find hanya dicari di dalam satuan itu. Tidak ketemu -> POSITION_MISMATCH (0 tulis).
      const units = unitsOf(parts);
      const want = exactView(e.target.plain).text;
      // IMPL-W4 W3-L1r: satuan daftar/kutipan ("- x", "1. x", "> x") bukan paragraf server (paragraphsOf hanya menghitung
      // blok paragraph), jadi tidak ikut dihitung agar nth tidak bergeser oleh butir daftar berteks sama.
      const cands = units.filter((u) => u.kind === "paragraph" && !isFence(u) && !LIST_MARKER_RE.test(u.text.trimStart()) && parts[u.part].part === e.section && exactView(plainOf(u.text)).text === want);
      const u = e.target.nth >= 0 ? cands[e.target.nth] : undefined;
      if (u === undefined) throw new McpToolError("POSITION_MISMATCH", `${label}: paragraf ber-pid itu tidak dapat dipetakan tepat ke teks bab (${cands.length} kandidat); tidak ada yang ditulis. Pakai { find, replace, section }`);
      const { hits } = findText(e.find, matchUnitsOf([u], parts), {}, label);
      if (hits[0].tier === "fuzzy") warn({ code: "FUZZY_MATCH", message: `${label}: find cocok setelah normalisasi` });
      applyFind({ unit: u, spans: hits[0].spans, tier: hits[0].tier }, e.find, e.replace, false, label);
      return;
    }
    const all = e.occurrence === "all";
    const hits = locate(e.find, parts, label, { ...(e.section !== undefined ? { section: e.section } : {}), all });
    if (hits.some((h) => h.tier === "fuzzy")) warn({ code: "FUZZY_MATCH", message: `${label}: find cocok setelah normalisasi (huruf besar/kecil, spasi, kutip, tanda pisah, markah, angka); ${hits.length} sasaran diganti` });
    // Urut menurun (bagian, region, baris) agar perubahan jumlah baris tidak menggeser satuan yang belum diproses.
    const order = (h: Hit) => [h.unit.part, ["header", "intro", "body", "tail"].indexOf(h.unit.region), h.unit.start];
    hits.sort((x, y) => {
      const a = order(x);
      const b = order(y);
      return b[0] - a[0] || b[1] - a[1] || b[2] - a[2];
    });
    for (const h of hits) applyFind(h, e.find, e.replace, all, label);
  };
  edits.forEach((e, i) => {
    const label = `edit ${i + 1}`;
    try {
      applyOne(e, label);
      changed = true;
    } catch (err) {
      // E4: galat alamat -> suntingan ini tidak diterapkan (kandidat dari keadaan yang dilihatnya); galat lain menolak batch.
      const na = notAppliedOf(err, i, changed);
      if (na === null) throw err;
      notApplied.push(na);
      errors.push(err);
    }
  });
  function applyFind(h: Hit, find: string, replace: string, all: boolean, label: string): void {
    const u = h.unit;
    const lines = parts[u.part].md[u.region];
    if (u.kind === "paragraph" && replace === "") {
      // L-1: hapus paragraf hanya bila find = SELURUH paragraf (agar teks penulis lain di paragraf itu tidak ikut hilang).
      const whole = normalize(find).text;
      if (whole !== normalize(u.text).text && normalize(plainOf(find)).text !== normalize(plainOf(u.text)).text && fold(find).text !== fold(u.text).text) {
        throw new McpToolError("EDIT_INVALID", `${label}: replace "" menghapus paragraf hanya bila find berisi SELURUH teks paragraf itu; untuk membuang sebagian kalimat, tulis replace berisi sisa kalimat. Tidak ada yang ditulis`);
      }
      splice(u.part, u.region, u.start, u.end - u.start, []);
      delta(u.part, 1, -1);
      touched.add(u.part);
      return;
    }
    // Samar dengan markah di dalam rentang, atau cocok hanya tanpa markah -> satuan ditulis ulang sebagai teks polos.
    // Blok kode berpagar: selalu irisan mentah (isi kode literal), tidak pernah ditulis ulang polos (W3-L3).
    const plain = !isFence(u) && (h.spans === null || (h.tier === "fuzzy" && spansHaveMarkup(u.text, h.spans)));
    if (plain) warn({ code: "MARKUP_DROPPED", message: `${label}: teks cocok hanya tanpa markah inline; satuan itu ditulis ulang sebagai teks polos` });
    const plainNext = () => plainReplaced(u.text, find, replace, all, h.tier === "fuzzy");
    if (u.kind === "field") {
      const m = FIELD_RE.exec(lines[u.start]) as RegExpExecArray;
      const next = plain ? plainNext() : spliceSpans(u.text, h.spans as Array<[number, number]>, () => replace);
      const v = next.replace(/\s+/g, " ").trim();
      if (v === "") splice(u.part, u.region, u.start, 1, []);
      else lines[u.start] = `${m[1]}: ${v}`;
      plan.fields.add(FIELD_NAMES[m[1].trim().toLowerCase()] ?? m[1].trim());
    } else if (u.kind === "cell") {
      cellSet(u, plain ? plainNext() : spliceSpans(u.text, h.spans as Array<[number, number]>, () => replace));
      return;
    } else if (!plain) {
      // M-1: pengganti di dalam paragraf lewat guardFragment (tanpa baris baru, | dan : di-escape, awal baris dijaga).
      // L-2: irisan indeks (spliceSpans), tanpa tafsir $' $` $&.
      let escaped = false;
      const next = spliceSpans(u.text, h.spans as Array<[number, number]>, (at) => {
        const before = u.text.slice(0, at);
        const repl = guardFragment(replace, before.slice(before.lastIndexOf("\n") + 1));
        escaped ||= repl !== replace;
        return repl;
      });
      if (escaped) warn({ code: "TEXT_ESCAPED", message: `${label}: teks pengganti yang menyerupai struktur di-escape agar tetap teks` });
      splice(u.part, u.region, u.start, u.end - u.start, next.split("\n"), true);
      delta(u.part, 1, 0);
    } else {
      splice(u.part, u.region, u.start, u.end - u.start, paragraphLines(plainNext(), warn, label), true);
      delta(u.part, 1, 0);
    }
    touched.add(u.part);
  }
  // Semua suntingan gagal alamat -> perilaku lama: galat pertama (ok:false, 0 tulis).
  if (edits.length > 0 && notApplied.length === edits.length) throw errors[0];
  normalizeItemStatuses(parts, snapshot, trust, opts.prevItemStatus ?? new Map(), warn);
  reguard(parts, snapshot, trusted);
  return { touched, plan, notApplied, errors };
}

/** E2: tabel sasaran addRow: bawaan terakhir; angka = urutan 1..n di section; teks = keterangan atau baris judul. */
function pickTable(tables: readonly TableRef[], sel: number | string | undefined, label: string): TableRef {
  const list = () => ({ untrusted: true, details: { edit: label, tables: tables.map((t, i) => ({ table: i + 1, header: t.header.slice(0, 8).join(" | "), caption: t.caption.slice(0, 120) })) } });
  if (tables.length === 0) throw new McpToolError("TEXT_NOT_FOUND", `${label}: section itu tidak memuat tabel; tambahkan tabel dengan append. Tidak ada yang ditulis untuk suntingan ini`, list());
  if (sel === undefined) return tables[tables.length - 1];
  if (typeof sel === "number") {
    if (sel >= 1 && sel <= tables.length) return tables[sel - 1];
    throw new McpToolError("TEXT_NOT_FOUND", `${label}: section itu memuat ${tables.length} tabel, bukan tabel ${sel}. Daftar tabel ada di blok rincian`, list());
  }
  const f = fold(sel).text.trim();
  const hit = tables.filter((t) => fold(t.caption).text.includes(f) || fold(t.header.join(" ")).text.includes(f));
  if (hit.length === 1) return hit[0];
  throw new McpToolError(hit.length === 0 ? "TEXT_NOT_FOUND" : "TEXT_AMBIGUOUS", `${label}: ${hit.length === 0 ? "tidak ada tabel yang keterangan/judul kolomnya memuat teks table" : `${hit.length} tabel cocok; pakai nomor tabel`}. Daftar tabel ada di blok rincian`, list());
}

/**
 * IMPL-W5 E5: sel status tabel butir yang berubah/baru -> kode registri lewat alias (terblokir -> blocked, butuh
 * tinjauan -> review, ...). Tak terpetakan: butir yang sudah ada di record memakai status sebelumnya (ITEM_STATUS_KEPT;
 * butir tidak pernah hilang); butir baru tetap di teks tanpa masuk record (ITEM_STATUS_UNKNOWN). Tidak pernah menolak.
 */
function normalizeItemStatuses(parts: EditPart[], snapshot: ReadonlyArray<Record<Region, string[]>>, trust: (pi: number, line: string) => void, prev: ReadonlyMap<string, string>, warn: (w: ToolWarning) => void): void {
  const kept: string[] = [];
  const unknown: string[] = [];
  parts.forEach((p, pi) => {
    if (p.part === "record") return;
    for (const r of ["intro", "body", "tail"] as const) {
      const lines = p.md[r];
      const left = new Map<string, number>();
      for (const l of snapshot[pi][r]) left.set(l, (left.get(l) ?? 0) + 1);
      for (const t of tablesIn(lines, 0, lines.length)) {
        const head = t.header.map((h) => h.trim().toLowerCase());
        const keyIdx = head.findIndex((h) => ITEM_KEY_COLUMNS.has(h));
        const st = head.indexOf("status");
        if (keyIdx < 0 || st < 0) continue;
        for (let i = t.start + 1; i < t.end; i++) {
          if (TABLE_SEP_RE.test(lines[i].trim())) continue;
          if ((left.get(lines[i]) ?? 0) > 0) {
            left.set(lines[i], (left.get(lines[i]) as number) - 1);
            continue;
          }
          const cells = splitRow(lines[i]);
          const raw = (cells[st] ?? "").replace(/\\\|/g, "|");
          const key = (cells[keyIdx] ?? "").trim();
          let next = itemStatusOf(raw);
          if (next === undefined) {
            next = prev.get(key.toLowerCase());
            if (next !== undefined) kept.push(`${key}: ${raw.slice(0, 40)}`);
            else unknown.push(`${key}: ${raw.slice(0, 40)}`);
          }
          if (next === undefined || next === raw.trim()) continue;
          cells[st] = next;
          lines[i] = joinRow(cells);
          trust(pi, lines[i]);
        }
      }
    }
  });
  if (kept.length > 0) warn({ code: "ITEM_STATUS_KEPT", message: `status butir tidak dikenal (${kept.slice(0, 5).join("; ")}); butir tetap di record dengan status sebelumnya, teks lain diterapkan. Pakai done, running, ready, todo, review, blocked, cancelled` });
  if (unknown.length > 0) warn({ code: "ITEM_STATUS_UNKNOWN", message: `status butir baru tidak dikenal (${unknown.slice(0, 5).join("; ")}); baris tetap di teks, belum masuk record sampai statusnya dikenal. Pakai done, running, ready, todo, review, blocked, cancelled` });
}

/**
 * Cadangan tanpa markah: proyeksi polos satuan dengan kemunculan pertama (atau semua) `find` diganti (irisan, tanpa
 * pola $). `fuzzy`: dicari lewat lipatan samar atas proyeksi polos.
 */
function plainReplaced(text: string, find: string, replace: string, all = false, fuzzy = false): string {
  const p = normalize(plainOf(text)).text;
  if (fuzzy) {
    const f = fold(p);
    const ff = fold(find).text;
    const spans: Array<[number, number]> = [];
    for (let k = f.text.indexOf(ff); k >= 0 && ff !== ""; k = f.text.indexOf(ff, k + ff.length)) {
      spans.push([f.map[k], f.map[k + ff.length - 1] + 1]);
      if (!all) break;
    }
    return spliceSpans(p, spans, () => replace);
  }
  const f = normalize(plainOf(find)).text;
  const spans: Array<[number, number]> = [];
  for (let k = p.indexOf(f); k >= 0 && f !== ""; k = p.indexOf(f, k + f.length)) {
    spans.push([k, k + f.length]);
    if (!all) break;
  }
  return spliceSpans(p, spans, () => replace);
}

/**
 * M-1: teks pengganti di tengah paragraf Markdown: baris baru dirapatkan, setiap `|` dan `:` di-escape (tidak ada
 * tabel atau `Kunci: nilai`/`agentId:` baru), dan bila pengganti jatuh di awal baris (boleh sesudah penanda daftar/
 * kutipan) awalnya dijaga {@link guardLine}.
 */
export function guardFragment(repl: string, linePrefix: string): string {
  let out = repl.replace(/\s+/g, " ").replace(/(?<!\\)\|/g, "\\|").replace(/(?<!\\):/g, "\\:");
  if (/^\s*(?:(?:[-*+>]|\d{1,9}[.)])\s+)*$/.test(linePrefix)) {
    const lead = /^\s*/.exec(out)?.[0] ?? "";
    out = lead + guardLine(out);
  }
  return out;
}
