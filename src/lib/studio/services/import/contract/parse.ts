/**
 * Pemindai sumber + pengurai nilai generator `md2contract/v1` (DC-24; register 05 §16).
 * Murni: hanya fungsi dari teks. Tidak ada tebakan: nilai yang tidak cocok alias/pola
 * dikembalikan `null` dan pemanggil mencatatnya (KD-42).
 */
import { CARD_ID_PATTERN, CONTRACT_ACTOR_PATTERN, CONTRACT_KEY_PATTERN, CONTRACT_REPORTED_AT_PATTERN } from "../../../contract/env";
import { atxHeading, splitTableRow } from "../lexer";

export const CARD_ID_RE = new RegExp(CARD_ID_PATTERN);
export const CONTRACT_KEY_RE = new RegExp(CONTRACT_KEY_PATTERN);
export const CONTRACT_ACTOR_RE = new RegExp(CONTRACT_ACTOR_PATTERN);
const REPORTED_AT_RE = new RegExp(CONTRACT_REPORTED_AT_PATTERN);
/** Id kartu di dalam teks (C34 tanpa jangkar; dibatasi batas kata). */
const CARD_ID_SCAN_RE = /(?<![A-Za-z0-9_])t_[0-9a-f]{8}(?![A-Za-z0-9_])/g;

/** Kepala = 40 baris pertama (§16.1; inventaris DC-01 `head_keys`). */
export const HEADER_SCAN_LINES = 40;

// ── Sumber ───────────────────────────────────────────────────────────────

/** CRLF/BOM dinormalkan sama dengan importer md/v1. */
export function normalizeSource(md: string): string {
  return (md.charCodeAt(0) === 0xfeff ? md.slice(1) : md).replace(/\r\n?/g, "\n");
}

const FENCE_RE = /^( {0,3})(`{3,}|~{3,})(.*)$/;

/**
 * `true` untuk baris di dalam pagar kode (termasuk baris pembuka dan penutup), dengan aturan
 * pembuka/penutup yang sama dengan lexer md/v1 (`lexer.ts` FENCE_RE).
 */
export function fenceMask(lines: readonly string[]): boolean[] {
  const mask = new Array<boolean>(lines.length).fill(false);
  for (let i = 0; i < lines.length; i++) {
    const f = FENCE_RE.exec(lines[i]);
    if (!f || (f[2][0] === "`" && f[3].includes("`"))) continue;
    const ch = f[2][0] === "`" ? "`" : "~";
    const closeRe = new RegExp(`^ {0,3}${ch}{${f[2].length},}[ \\t]*$`);
    mask[i] = true;
    let j = i + 1;
    while (j < lines.length && !closeRe.test(lines[j])) mask[j++] = true;
    if (j < lines.length) mask[j] = true;
    i = j;
  }
  return mask;
}

/** Indeks baris penutup frontmatter (`---` ... `---`), atau -1. */
export function frontMatterEnd(lines: readonly string[]): number {
  if (lines.length === 0 || lines[0].trim() !== "---") return -1;
  for (let j = 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (t === "---" || t === "...") return j;
  }
  return -1;
}

/** Normalisasi judul `##` = inventaris DC-01 `norm_h` (inv §2.1; dicocokkan persis ke alias GA). */
export function normalizeHeading(s: string): string {
  let t = s.trim().replace(/#+$/, "").trim().toLowerCase();
  t = t.replace(/^[([]?[a-z0-9]{1,3}[.)\]]\s+/, "");
  t = t.replace(/\d+/g, "N");
  t = t.replace(/\s+/g, " ");
  return t.slice(0, 70);
}

/** Judul ATX level n di luar pagar; `null` bila bukan. */
export function headingAt(line: string, level: number): string | null {
  const h = atxHeading(line);
  return h && h.level === level ? h.text : null;
}

/**
 * Baris `Kunci: nilai` / `**Kunci:** nilai` / `- **Kunci:** nilai` (regex `KV` inventaris DC-01,
 * ditambah tangkapan nilai). Kunci dikembalikan huruf kecil.
 */
const KV_RE = /^\s*(?:[-*>]\s*)*\*{0,2}([A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ_ /-]{1,28}?)\*{0,2}\s*:\*{0,2}\s+(\S.*)$/;

export function keyValueOf(line: string): { key: string; value: string } | null {
  const m = KV_RE.exec(line);
  if (!m) return null;
  const key = m[1].trim().toLowerCase();
  if (key.includes("http") || key.length < 2) return null;
  return { key, value: m[2].trim() };
}

/** Kunci frontmatter YAML sederhana `kunci: nilai`. */
export function frontMatterKeyValue(line: string): { key: string; value: string } | null {
  const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
  if (!m) return null;
  return { key: m[1].toLowerCase(), value: m[2].trim() };
}

// ── Tabel GFM ────────────────────────────────────────────────────────────

const DELIM_ROW_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

export interface SourceTable {
  /** Baris kepala 1-based. */
  line: number;
  header: string[];
  rows: Array<{ line: number; cells: string[] }>;
}

/** Tabel pipa di luar pagar: kepala + baris pemisah + baris data. */
export function findTables(lines: readonly string[], mask: readonly boolean[]): SourceTable[] {
  const out: SourceTable[] = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    if (mask[i] || mask[i + 1] || !lines[i].includes("|") || !DELIM_ROW_RE.test(lines[i + 1]) || !lines[i + 1].includes("-")) continue;
    const header = splitTableRow(lines[i]);
    const rows: SourceTable["rows"] = [];
    let j = i + 2;
    while (j < lines.length && !mask[j] && lines[j].trim() !== "" && lines[j].includes("|")) {
      rows.push({ line: j + 1, cells: splitTableRow(lines[j]) });
      j++;
    }
    out.push({ line: i + 1, header, rows });
    i = j - 1;
  }
  return out;
}

// ── Nilai ────────────────────────────────────────────────────────────────

/** Buang pembungkus tampilan (`**`, `_`, backtick, kutip) di tepi nilai. */
export function cleanValue(v: string): string {
  let t = v.trim();
  for (let k = 0; k < 3; k++) {
    const before = t;
    t = t.replace(/^\*{1,2}|\*{1,2}$/g, "").trim();
    t = t.replace(/^`+|`+$/g, "").trim();
    t = t.replace(/^["']|["']$/g, "").trim();
    if (t === before) break;
  }
  return t;
}

/** Token awal nilai (kata pertama; sisanya = keterangan penulis, mis. `FAIL (satu FAIL ...)`). */
export function leadToken(v: string): string {
  const m = /^[A-Za-z0-9_.-]+/.exec(cleanValue(v));
  return m ? m[0] : "";
}

/** Semua id kartu C34 dalam teks, unik, urut kemunculan. */
export function cardIdsIn(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(CARD_ID_SCAN_RE)) seen.add(m[0]);
  return [...seen];
}

export function actorOf(v: string): string | null {
  const t = leadToken(v).toLowerCase();
  return CONTRACT_ACTOR_RE.test(t) ? t : null;
}

export function contractKeyOf(v: string): string | null {
  const t = cleanValue(v);
  return CONTRACT_KEY_RE.test(t) ? t : null;
}

function isCalendarDate(y: number, mo: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

const DATE_LEAD_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)?(?:\s*(Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d|WIB)(?![A-Za-z0-9]))?/;

export interface ParsedReportedAt {
  value: string;
  /** Jam ada tetapi zona tidak: hanya tanggal yang dipakai (zona tidak ditebak). */
  timeDropped: boolean;
}

/**
 * Tanggal/waktu lapor (C37). Jam tanpa zona -> hanya tanggal (`timeDropped`); `WIB` -> `+07:00`;
 * `+0700` -> `+07:00`. Tanggal di luar kalender -> `null`. `whole`: seluruh string harus terpakai.
 */
export function parseReportedAt(v: string, whole = false): ParsedReportedAt | null {
  const t = cleanValue(v);
  const m = DATE_LEAD_RE.exec(t);
  if (!m) return null;
  if (whole && m[0].length !== t.length) return null;
  const [, y, mo, d, hh, mm, ss, zone] = m;
  if (!isCalendarDate(Number(y), Number(mo), Number(d))) return null;
  const date = `${y}-${mo}-${d}`;
  let value = date;
  let timeDropped = false;
  if (hh !== undefined) {
    if (zone === undefined) timeDropped = true;
    else {
      const z = zone === "WIB" ? "+07:00" : zone === "Z" ? "Z" : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone;
      value = `${date}T${hh}:${mm}${ss !== undefined ? `:${ss}` : ""}${z}`;
    }
  }
  return REPORTED_AT_RE.test(value) ? { value, timeDropped } : null;
}

// ── Bukti (GL-03) ────────────────────────────────────────────────────────

const PATH_RE = /(?:^|[\s(`'"])((?:[A-Za-z]:)?[A-Za-z0-9_.~\\/-]*[A-Za-z0-9_~-]\.[A-Za-z0-9]{1,8})(?=$|[\s)`'",:;])/;
const BYTES_RE = /(?<![\d.])(\d{1,3}(?:\.\d{3})+|\d+)\s?B\b/;
const SHA_RE = /sha[0-9a-z[\]:]*\s*[=: ]\s*`?([0-9a-f]{8,64})\b/i;

export interface EvidenceSegment {
  ref: string;
  bytes?: number;
  sha256?: string;
}

/**
 * GL-03: setiap segmen dipisah `;` yang memuat path berekstensi -> bukti `file`;
 * `NN B`/`NN.NNN B` -> `bytes` (titik ribuan dibuang); heksa >= 8 sesudah `sha` -> `sha256`.
 * Segmen tanpa path hanya teks (tidak dikembalikan).
 */
export function evidenceSegments(text: string): EvidenceSegment[] {
  const out: EvidenceSegment[] = [];
  for (const seg of text.split(";")) {
    const p = PATH_RE.exec(seg);
    if (!p) continue;
    const ref = p[1].replace(/[.]+$/, "");
    if (!/\.[A-Za-z0-9]{1,8}$/.test(ref) || /^\d+(\.\d+)*$/.test(ref) || ref.length > 500) continue;
    const e: EvidenceSegment = { ref };
    const b = BYTES_RE.exec(seg);
    if (b) e.bytes = Number(b[1].replace(/\./g, ""));
    const s = SHA_RE.exec(seg);
    if (s) e.sha256 = s[1].toLowerCase();
    out.push(e);
  }
  return out;
}
