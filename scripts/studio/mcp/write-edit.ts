/**
 * IMPL-W `studio_edit` (D-521/D-522): sunting bergaya patch atas teks Markdown bagian dokumen (hasil serialisasi
 * server yang sama dengan `studio_report_refresh`). Satuan sunting = paragraf, sel tabel, atau medan record (baris
 * `Kunci: nilai`). `find` dicocokkan sebagai substring persis dengan spasi dinormalkan dan harus mengenai tepat satu
 * satuan (sekali); selain itu TEXT_NOT_FOUND / TEXT_AMBIGUOUS dengan kandidat terdekat. Murni: tanpa I/O.
 */
import type { ReportPartMarkdown } from "../../../src/lib/studio/services/draft/md-report";
import { McpToolError } from "./safety";
import type { ToolWarning } from "./tool-kit";
import { cellText, guardLine, paragraphLines } from "./write-content";

export type Region = keyof ReportPartMarkdown;
export interface EditPart {
  part: string;
  md: ReportPartMarkdown;
}
export type EditOp = { find: string; replace: string } | { after: string; insert: string };

export interface Unit {
  part: number;
  region: Region;
  kind: "field" | "paragraph" | "cell";
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
      if (m) out.push({ part, region, kind: "field", start: i, end: i + 1, blockEnd: i + 1, text: m[2] });
    });
    return out;
  }
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === "" || /^#{1,6}\s/.test(l)) {
      i++;
      continue;
    }
    const fence = FENCE_RE.exec(l);
    if (fence) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith(fence[1])) j++;
      const end = Math.min(j + 1, lines.length);
      out.push({ part, region, kind: "paragraph", start: i, end, blockEnd: end, text: lines.slice(i, end).join("\n") });
      i = end;
      continue;
    }
    if (l.trimStart().startsWith("|")) {
      let j = i;
      while (j < lines.length && lines[j].trimStart().startsWith("|")) j++;
      for (let r = i; r < j; r++) {
        if (TABLE_SEP_RE.test(lines[r].trim())) continue;
        splitRow(lines[r]).forEach((c, ci) => out.push({ part, region, kind: "cell", start: r, end: r + 1, blockEnd: j, cell: ci, text: c.replace(/\\\|/g, "|") }));
      }
      i = j;
      continue;
    }
    let j = i;
    while (j < lines.length && lines[j].trim() !== "" && !/^#{1,6}\s/.test(lines[j]) && !lines[j].trimStart().startsWith("|") && !FENCE_RE.test(lines[j])) j++;
    out.push({ part, region, kind: "paragraph", start: i, end: j, blockEnd: j, text: lines.slice(i, j).join("\n") });
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

function occurrences(hay: string, needle: string): number[] {
  const at: number[] = [];
  for (let k = hay.indexOf(needle); k >= 0; k = hay.indexOf(needle, k + needle.length)) at.push(k);
  return at;
}

export interface Hit {
  unit: Unit;
  /** indeks asli [awal, akhir) di unit.text; null = cocok lewat proyeksi tanpa markah. */
  span: [number, number] | null;
}

const snippet = (s: string, at = 0): string => {
  const t = s.replace(/\s+/g, " ").trim();
  const from = Math.max(0, at - 40);
  return `${from > 0 ? "..." : ""}${t.slice(from, from + 120)}${t.length > from + 120 ? "..." : ""}`;
};
const describe = (u: Unit, parts: readonly EditPart[]) => ({ part: parts[u.part].part, kind: u.kind, text: snippet(u.text) });

/** Kandidat terdekat (irisan kata) untuk TEXT_NOT_FOUND. */
function nearest(find: string, units: readonly Unit[], parts: readonly EditPart[]): Array<Record<string, unknown>> {
  const words = new Set(find.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3));
  return units
    .map((u) => ({ u, score: [...new Set(u.text.toLowerCase().split(/[^\p{L}\p{N}]+/u))].filter((w) => words.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => describe(x.u, parts));
}

/** Satu satuan, satu kemunculan; selain itu galat (data dokumen di details = tak tepercaya). */
export function locate(find: string, parts: readonly EditPart[], label: string): Hit {
  const nf = normalize(find).text;
  if (nf === "") throw new McpToolError("INVALID_ARGUMENT", `${label}: teks find/after kosong`);
  const units = unitsOf(parts);
  const exact: Hit[] = [];
  let count = 0;
  for (const u of units) {
    const n = normalize(u.text);
    const at = occurrences(n.text, nf);
    count += at.length;
    for (const k of at) exact.push({ unit: u, span: [n.map[k], n.map[k + nf.length - 1] + 1] });
  }
  let hits = exact;
  if (count === 0) {
    // Cadangan tanpa markah: satuan > PLAIN_MAX dilewati (tidak pernah ditulis ulang dari teks terpotong); satu proyeksi per satuan.
    const pf = normalize(plainOf(find)).text;
    hits = [];
    count = 0;
    if (pf !== "") {
      for (const u of units) {
        if (u.text.length > PLAIN_MAX) continue;
        const n = occurrences(normalize(plainOf(u.text)).text, pf).length;
        if (n > 0) hits.push({ unit: u, span: null });
        count += n;
      }
    }
  }
  if (count === 0) {
    throw new McpToolError("TEXT_NOT_FOUND", `${label}: teks tidak ditemukan di paragraf, sel tabel, atau medan record dokumen (dicocokkan persis, spasi dinormalkan). Kandidat terdekat ada di blok rincian; tidak ada yang ditulis`, {
      untrusted: true,
      details: { edit: label, candidates: nearest(nf, units, parts) },
    });
  }
  if (count > 1) {
    throw new McpToolError("TEXT_AMBIGUOUS", `${label}: teks muncul ${count} kali; perpanjang find sampai unik. Lokasi ada di blok rincian; tidak ada yang ditulis`, {
      untrusted: true,
      details: { edit: label, matches: hits.slice(0, 5).map((h) => describe(h.unit, parts)) },
    });
  }
  return hits[0];
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
}

const FIELD_NAMES: Readonly<Record<string, string>> = { status: "status", owner: "owner", reportedat: "reportedAt", verdict: "verdict", initiator: "initiator", taskref: "taskRef", cardids: "cardIds" };
const LIST_MARKER_RE = /^((?:[-*+]|\d{1,9}[.)]|>)\s+)(.*)$/;

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

/** Terapkan suntingan berurutan (setiap suntingan melihat hasil sebelumnya). Mengembalikan bagian tersentuh + rencana. */
export function applyEdits(parts: EditPart[], edits: readonly EditOp[], warn: (w: ToolWarning) => void): { touched: Set<number>; plan: EditPlan } {
  const touched = new Set<number>();
  const plan: EditPlan = { fields: new Set(), itemCells: false, refCells: false, paraDelta: new Map() };
  const delta = (pi: number, removed: number, d: number) => {
    const k = parts[pi].part;
    const cur = plan.paraDelta.get(k) ?? { removedMax: 0, delta: 0 };
    plan.paraDelta.set(k, { removedMax: cur.removedMax + removed, delta: cur.delta + d });
  };
  const snapshot = parts.map((p) => ({ header: [...p.md.header], intro: [...p.md.intro], body: [...p.md.body], tail: [...p.md.tail] }));
  const trusted = parts.map(() => new Map<string, number>());
  edits.forEach((e, i) => {
    const label = `edit ${i + 1}`;
    if ("insert" in e) {
      const h = locate(e.after, parts, label);
      if (h.unit.kind === "field") throw new McpToolError("INVALID_ARGUMENT", `${label}: after menunjuk medan record; sisipan hanya sesudah paragraf atau tabel`);
      const lines = parts[h.unit.part].md[h.unit.region];
      const add = e.insert.trim() === "" ? [] : paragraphLines(e.insert.trim(), warn, label);
      if (add.length === 0) throw new McpToolError("INVALID_ARGUMENT", `${label}: insert kosong`);
      lines.splice(h.unit.blockEnd, 0, "", ...add, "");
      delta(h.unit.part, 0, e.insert.trim().split(/\n\s*\n/).filter((x) => x.trim() !== "").length);
      touched.add(h.unit.part);
      return;
    }
    const h = locate(e.find, parts, label);
    const u = h.unit;
    const lines = parts[u.part].md[u.region];
    if (u.kind === "paragraph" && e.replace === "") {
      // L-1: hapus paragraf hanya bila find = SELURUH paragraf (agar teks penulis lain di paragraf itu tidak ikut hilang).
      const whole = normalize(e.find).text;
      if (whole !== normalize(u.text).text && normalize(plainOf(e.find)).text !== normalize(plainOf(u.text)).text) {
        throw new McpToolError("EDIT_INVALID", `${label}: replace "" menghapus paragraf hanya bila find berisi SELURUH teks paragraf itu; untuk membuang sebagian kalimat, tulis replace berisi sisa kalimat. Tidak ada yang ditulis`);
      }
      lines.splice(u.start, u.end - u.start);
      delta(u.part, 1, -1);
      touched.add(u.part);
      return;
    }
    if (h.span === null) warn({ code: "MARKUP_DROPPED", message: `${label}: teks cocok hanya tanpa markah inline; satuan itu ditulis ulang sebagai teks polos` });
    // L-2: irisan indeks (bukan String.replace dengan string pengganti: tanpa tafsir $' $` $&).
    const spliced = (text: string, at: number, len: number, repl: string) => text.slice(0, at) + repl + text.slice(at + len);
    if (u.kind === "field") {
      const m = FIELD_RE.exec(lines[u.start]) as RegExpExecArray;
      const next = h.span !== null ? spliced(u.text, h.span[0], h.span[1] - h.span[0], e.replace) : u.text;
      const v = next.replace(/\s+/g, " ").trim();
      if (v === "") lines.splice(u.start, 1);
      else lines[u.start] = `${m[1]}: ${v}`;
      plan.fields.add(FIELD_NAMES[m[1].trim().toLowerCase()] ?? m[1].trim());
    } else if (u.kind === "cell") {
      const next = h.span !== null ? spliced(u.text, h.span[0], h.span[1] - h.span[0], e.replace) : plainReplaced(u.text, e.find, e.replace);
      const cells = splitRow(lines[u.start]);
      cells[u.cell as number] = cellText(next);
      lines[u.start] = joinRow(cells);
      trusted[u.part].set(lines[u.start], (trusted[u.part].get(lines[u.start]) ?? 0) + 1);
      if (u.region === "tail") plan.refCells = true;
      else plan.itemCells = true;
    } else if (h.span !== null) {
      // M-1: pengganti di dalam paragraf lewat guardFragment (tanpa baris baru, | dan : di-escape, awal baris dijaga).
      const before = u.text.slice(0, h.span[0]);
      const linePrefix = before.slice(before.lastIndexOf("\n") + 1);
      const repl = guardFragment(e.replace, linePrefix);
      if (repl !== e.replace) warn({ code: "TEXT_ESCAPED", message: `${label}: teks pengganti yang menyerupai struktur di-escape agar tetap teks` });
      lines.splice(u.start, u.end - u.start, ...spliced(u.text, h.span[0], h.span[1] - h.span[0], repl).split("\n"));
      delta(u.part, 1, 0);
    } else {
      lines.splice(u.start, u.end - u.start, ...paragraphLines(plainReplaced(u.text, e.find, e.replace), warn, label));
      delta(u.part, 1, 0);
    }
    touched.add(u.part);
  });
  reguard(parts, snapshot, trusted);
  return { touched, plan };
}

/** Cadangan tanpa markah: proyeksi polos satuan dengan kemunculan pertama `find` diganti (irisan, tanpa pola $). */
function plainReplaced(text: string, find: string, replace: string): string {
  const p = normalize(plainOf(text)).text;
  const f = normalize(plainOf(find)).text;
  const k = p.indexOf(f);
  return k < 0 ? p : p.slice(0, k) + replace + p.slice(k + f.length);
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
