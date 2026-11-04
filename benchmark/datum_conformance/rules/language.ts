/**
 * S23: modul aturan bahasa dan angka konformitas DATUM Rev A.
 *
 * Kode (kolom `module: "language"` di `catalog.ts`; pemeriksaan = research/32):
 * - CR-2 pola nomor dan daftar kode tertutup tanpa DS (§2, kritis)
 * - CR-3 konvensi angka per bahasa, sampel + fiksur B-FIX `--bfix` (§2, §10, kritis)
 * - CR-4 bahasa teks pembungkus: daftar inti AC-6, daftar cermin, penanda wajib; untuk EN juga
 *   label aparatus ID (Tabel/Gambar/Turunan/SUMBER/PROVENANS/KUNCI/MEMENUHI, D-598 F-2) (§2, kritis)
 * - NU-02, NU-03 (dari `--spec`), NU-05, NU-07 (§8); NC-04 (§10); AC6-03 (§11)
 * - LB-01, LB-02, LB-03, LB-06, LB-09, LB-10, LB-11 (§12)
 * - X-01..X-05 detektor bentrok teks pembungkus (§13, D-593): `fail` = bentrok, dihitung di
 *   total bentrok, bukan skor.
 *
 * Semua nilai per bahasa ada di `expect_language.ts` dan dipilih menurut `pair.language` /
 * `pair.typeCode`; modul ini tidak pernah bercabang pada slug templat.
 *
 * Lokasi teks pembungkus (WL, research/32 §0.4) dikenali dari struktur, bukan dari id gaya
 * (DOCX Studio tidak memakai `w:pStyle` untuk unsur ini, diamati pada baseline S05):
 * - semua paragraf header dan footer; sel tabel register;
 * - seksi pembungkus: sel pita segel, paragraf tingkat atas ber-caps (kicker), sel label blok
 *   kendali sampul (sel 1 dan 3 baris tabel 4 sel), cap terbit kolofon, judul blok `X · ...`,
 *   baris pertama tabel (kepala kolom, peran tanda tangan), label entri daftar isi (`Bab 1`);
 * - seksi interior: kicker bab (paragraf ber-caps `KATA KUNCI`), kata label keterangan
 *   (`Tabel 2.1 ...`, `Turunan D-2.1 ...`; run pertama caps/tebal), label aparatus kapital
 *   (SUMBER/PROVENANS/KUNCI/MEMENUHI dan padanan EN) di run mana pun.
 * String punggung tidak dipindai token (subjeknya isi agen); dipakai NU-02, X-02, X-05.
 *
 * ── Bentuk JSON `--spec` (bukti NU-03; dipancarkan tabel spec templat S26) ──────────────
 *
 *   {
 *     "schema": "datum-template-spec/v1",
 *     "templates": [
 *       {
 *         "slug": "datum-standar-en",
 *         "params": {
 *           "doc.typeCode": ["PT","KT","RAB","SPH","SP","BA","NDA","DEK","LAP","MAT","STD","NOT","MOD","VER"],
 *           "doc.defaultTypeCode": "STD",
 *           "doc.defaultTier": "TERBIT",
 *           "doc.language": "EN",
 *           "cover.kicker.text": "STANDARD"
 *         }
 *       }
 *     ]
 *   }
 *
 * Kunci `params` = kunci parameter templat yang sudah ada (research/31 §3.1-§3.3). Satu baris
 * objek `{ slug, params }` tanpa pembungkus `templates` juga diterima. NU-03 mencari baris
 * `slug = pair.slug` lalu memeriksa: `doc.typeCode` = daftar tertutup TYPE_CODES persis
 * (urutan Tabel 3.1, tanpa DS, dengan NDA); `doc.defaultTypeCode`, `doc.defaultTier`,
 * `doc.language`, `cover.kicker.text` = konteks pasangan. Tanpa `--spec` = UNEXERCISED.
 */
import type { DocxDocument } from "../lib/docx";
import { isSealBandTable, type ClassifiedSection, type DocLayout } from "../lib/layout";
import { ancestor, type XmlElement } from "../lib/xml";
import {
  DOC_NUMBER_LOOSE_RE,
  DOC_NUMBER_RE,
  FORBIDDEN_NUMBER_PREFIXES,
  KICKERS_BY_TYPE,
  LANGUAGE_EXPECTATIONS,
  LEGACY_SIGNATURE_ROLES,
  NUMBER_SCAN_EXCLUSIONS,
  REVISION_TABLE_HEAD,
  TYPE_CODES,
  otherLang,
  type LangToken,
  type NumberConvention,
} from "./expect_language";
import { defineRule, fail, na, pass, unexercised, type Lang, type Rule, type RuleContext, type RuleResult } from "./types";

const LANGS: readonly Lang[] = ["ID", "EN"];
const MAX_LISTED = 8;

// ── Teks dan token ───────────────────────────────────────────────────────

/** NBSP -> spasi, spasi/tab beruntun dirapatkan, ujung dipangkas (perbandingan nilai, bukan pemindaian token). */
const norm = (s: string): string => s.replace(/\u00A0/g, " ").replace(/[ \t]+/g, " ").trim();
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokenReCache = new Map<string, RegExp>();
/** Kata/frasa utuh (batas kata Unicode), peka huruf; spasi frasa = spasi biasa atau NBSP (research/31 §6). */
function tokenRe(text: string): RegExp {
  let re = tokenReCache.get(text);
  if (!re) {
    const body = text.split(" ").map(escapeRe).join("[ \\u00A0]+");
    re = new RegExp(`(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])`, "u");
    tokenReCache.set(text, re);
  }
  return re;
}

type WlKind =
  | "header"
  | "footer"
  | "register"
  | "seal"
  | "kicker"
  | "controlLabel"
  | "colophon"
  | "blockHeading"
  | "tableHead"
  | "tocLabel"
  | "chapterKicker"
  | "caption"
  | "apparatus";

interface TextItem {
  /** Teks sumber. */
  readonly text: string;
  /** Teks tampak (caps efektif dikapitalkan). */
  readonly visible: string;
  readonly part: string;
  readonly location: string;
  readonly kind?: WlKind;
}

interface Hit {
  readonly token: string;
  readonly item: TextItem;
}

function findTokens(items: readonly TextItem[], tokens: readonly LangToken[]): Hit[] {
  const out: Hit[] = [];
  for (const item of items) {
    for (const t of tokens) {
      if (t.where === "register" && item.kind !== "register") continue;
      const re = tokenRe(t.text);
      if (re.test(item.text) || re.test(item.visible)) out.push({ token: t.text, item });
    }
  }
  return out;
}

function listHits(hits: readonly Hit[]): string {
  const shown = hits.slice(0, MAX_LISTED).map((h) => `"${h.token}" @ ${h.item.location}`);
  return shown.join("; ") + (hits.length > MAX_LISTED ? `; +${hits.length - MAX_LISTED} lagi` : "");
}

// ── Analisis dokumen (sekali per DOCX) ──────────────────────────────────

interface RegisterRow {
  readonly part: string;
  /** Teks sumber per sel (NBSP dipertahankan). */
  readonly cells: readonly string[];
}

interface Spine {
  readonly text: string;
  /** Medan pertama (`jenis`, texts.ts:174-182), apa adanya. */
  readonly jenis: string;
  /** `jenis` bila berbentuk kode jenis (2-4 huruf kapital); dipakai X-02. */
  readonly type?: string;
  readonly lang: string;
  readonly location: string;
}

interface Stamp {
  readonly text: string;
  readonly lang: string;
  /** Pemisah teramati: `--` sah; U+2014/U+2013 dilarang (page.ts:343). */
  readonly dash: string;
  readonly word: string;
  readonly location: string;
}

interface ControlPair {
  readonly label: string;
  readonly value: string;
  readonly location: string;
}

interface KickerPara {
  readonly text: string;
  readonly visible: string;
  readonly location: string;
}

interface Analysis {
  readonly registers: readonly RegisterRow[];
  readonly interiorHeaderRights: readonly { value: string; part: string }[];
  readonly sealCells: readonly { left: string; right: string; location: string }[];
  readonly controlPairs: readonly ControlPair[];
  readonly stamps: readonly Stamp[];
  readonly spines: readonly Spine[];
  readonly coverKickers: readonly KickerPara[];
  /** Paragraf tingkat atas seksi pembungkus (teks sumber/tampak). */
  readonly wrapperParas: readonly KickerPara[];
  readonly wl: readonly TextItem[];
  readonly allText: readonly TextItem[];
  readonly chapterKickers: readonly TextItem[];
  readonly captions: readonly TextItem[];
  readonly apparatusLabels: readonly TextItem[];
  /** Tabel seksi pembungkus selain sampul, bukan pita segel: baris -> sel (teks sumber). */
  readonly frontTables: readonly { rows: readonly (readonly string[])[]; location: string }[];
}

const cache = new WeakMap<DocxDocument, Analysis>();

/** Cap terbit di mana pun di paragraf (kolofon kiri/kanan bisa satu paragraf bertab); pemisah ditangkap agar em dash dilaporkan. */
const STAMP_RE = /\/\/ (\d{8}) ([A-Z]{2}) ([A-Z]) (--|\u2014|\u2013) (\S+) (\d+)/;
const BLOCK_HEADING_RE = /^[A-Z] · \S/;
const CHAPTER_KICKER_RE = /^(\S+) (\d{1,3}|[A-Z]{1,2})$/;
const CAPTION_RE = /^(\S+)\s+(?:(?:[A-Z]+[.-])?\d+(?:\.\d+)+|[A-Z]+[.-]\d+(?:\.\d+)*)(?=\s|$)/;
const ROLE_VOCAB = new Set([...LANGS.flatMap((l) => LANGUAGE_EXPECTATIONS[l].signatureRoles), ...LEGACY_SIGNATURE_ROLES]);
const TOC_TITLES = new Set(LANGS.map((l) => LANGUAGE_EXPECTATIONS[l].tocTitle.toUpperCase()));
/**
 * Label aparatus kapital (kedua bahasa): sebuah run interior dihitung label bila teksnya, sesudah
 * spasi dan tanda baca pengapit dibuang, SAMA DENGAN salah satu label ini (mesin menulis label
 * sebagai run tersendiri: "SUMBER  ", ". PROVENANS ", "   MEMENUHI"). Kata yang sama di dalam prosa
 * agen tidak dihitung.
 */
const CAPS_APPARATUS: ReadonlySet<string> = new Set([
  ...new Set(
    LANGS.flatMap((l) => [
      ...LANGUAGE_EXPECTATIONS[l].runLabels,
      ...LANGUAGE_EXPECTATIONS[l].apparatus.map((t) => t.text).filter((t) => t === t.toUpperCase()),
    ]),
  ),
]);
const LABEL_RUN_TRIM = /^[\s.,:;·]+|[\s.,:;·]+$/g;

function parseSpine(text: string): { jenis: string; type?: string; lang: string } | undefined {
  const fields = norm(text).split(" · ");
  if (fields.length < 4) return undefined;
  const rev = fields.findIndex((f) => /^REV \S+$/i.test(f));
  const lang = fields.find((f) => /^(ID|EN)$/.test(f));
  if (rev < 0 || !lang) return undefined;
  return { jenis: fields[0], type: /^[A-Z]{2,4}$/.test(fields[0]) ? fields[0] : undefined, lang };
}

function firstRunCaps(doc: DocxDocument, p: XmlElement): boolean {
  const r = doc.runs(p).find((x) => doc.runText(x).trim() !== "");
  return r ? doc.effectiveRunProps(r).caps : false;
}

function firstRunCapsOrBold(doc: DocxDocument, p: XmlElement): boolean {
  const r = doc.runs(p).find((x) => doc.runText(x).trim() !== "");
  if (!r) return false;
  const rp = doc.effectiveRunProps(r);
  return rp.caps || rp.bold;
}

function secName(s: ClassifiedSection): string {
  const cls = [...s.classes].filter((c) => c !== "wrapper");
  return `seksi ${s.index}${cls.length ? ` (${cls.join(",")})` : ""}`;
}

function analyse(doc: DocxDocument, layout: DocLayout): Analysis {
  const hit = cache.get(doc);
  if (hit) return hit;
  const DOCPART = "word/document.xml";
  const item = (text: string, visible: string, part: string, location: string, kind?: WlKind): TextItem => ({ text, visible, part, location, kind });
  const wl: TextItem[] = [];
  const allText: TextItem[] = [];

  // Seluruh teks bagian R0 (CR-4 daftar inti, lingkup `document`).
  for (const part of doc.textPartNames()) {
    const root = doc.part(part);
    if (!root) continue;
    doc.paragraphs(root).forEach((p, i) => {
      const text = doc.paragraphText(p);
      if (text.trim()) allText.push(item(text, doc.paragraphText(p, { visible: true }), part, `${part} paragraf ${i + 1}`));
    });
  }

  // Header dan footer (WL 1); sel register.
  const registerTables = new Set(layout.registerTables.values());
  for (const part of [...doc.headerParts(), ...doc.footerParts()]) {
    const root = doc.part(part);
    if (!root) continue;
    const isFooter = part.includes("footer");
    doc.paragraphs(root).forEach((p, i) => {
      const text = doc.paragraphText(p);
      if (!text.trim()) return;
      const tbl = ancestor(p, "w:tbl");
      const kind: WlKind = tbl && registerTables.has(tbl) ? "register" : isFooter ? "footer" : "header";
      wl.push(item(text, doc.paragraphText(p, { visible: true }), part, `${part} paragraf ${i + 1}`, kind));
    });
  }
  const registers: RegisterRow[] = [];
  const seenFooters = new Set<string>();
  for (const s of layout.interiors) {
    const f = s.footers.default;
    if (!f || seenFooters.has(f)) continue;
    seenFooters.add(f);
    const tbl = layout.registerTables.get(f);
    if (!tbl) continue;
    registers.push({ part: f, cells: doc.rowCells(doc.tableRows(tbl)[0]).map((tc) => doc.cellText(tc)) });
  }
  const interiorHeaderRights: { value: string; part: string }[] = [];
  const seenHeaders = new Set<string>();
  for (const s of layout.interiors) {
    const h = s.headers.default;
    if (!h || seenHeaders.has(h)) continue;
    seenHeaders.add(h);
    const root = doc.part(h);
    const first = root ? doc.paragraphs(root).map((p) => doc.paragraphText(p)).find((t) => t.trim() !== "") : undefined;
    if (first && first.includes("\t")) interiorHeaderRights.push({ value: first.slice(first.lastIndexOf("\t") + 1), part: h });
  }

  // Seksi pembungkus (WL 2).
  const sealCells: { left: string; right: string; location: string }[] = [];
  const controlPairs: ControlPair[] = [];
  const stamps: Stamp[] = [];
  const spines: Spine[] = [];
  const coverKickers: KickerPara[] = [];
  const wrapperParas: KickerPara[] = [];
  const frontTables: { rows: string[][]; location: string }[] = [];
  for (const s of layout.wrappers) {
    const where = secName(s);
    const isCover = s.classes.has("cover");
    const sealTables = new Set(doc.tables(s.blocks).filter((t) => isSealBandTable(doc, t)));
    for (const t of sealTables) {
      const cells = doc.rowCells(doc.tableRows(t)[0]).map((tc) => doc.cellText(tc));
      sealCells.push({ left: cells[0] ?? "", right: cells[1] ?? "", location: `${where} pita segel` });
      for (const c of doc.rowCells(doc.tableRows(t)[0])) wl.push(item(doc.cellText(c), doc.cellText(c, { visible: true }), DOCPART, `${where} pita segel`, "seal"));
    }
    // Paragraf (termasuk sel tabel): string punggung dan cap terbit.
    for (const p of doc.paragraphs(s.blocks)) {
      const text = doc.paragraphText(p);
      const tbl = ancestor(p, "w:tbl");
      if (tbl && sealTables.has(tbl)) continue;
      const st = STAMP_RE.exec(norm(text));
      if (st && isCover) {
        stamps.push({ text, lang: st[2], dash: st[4], word: st[5], location: `${where} cap terbit` });
        wl.push(item(text, doc.paragraphText(p, { visible: true }), DOCPART, `${where} cap terbit`, "colophon"));
        continue;
      }
      const sp = isCover ? parseSpine(text) : undefined;
      if (sp) spines.push({ text, jenis: sp.jenis, type: sp.type, lang: sp.lang, location: `${where} string punggung` });
    }
    // Paragraf tingkat atas.
    let tocish = s.classes.has("toc");
    s.blocks
      .filter((b) => b.name === "w:p")
      .forEach((p, i) => {
        const text = doc.paragraphText(p);
        if (!text.trim()) return;
        const visible = doc.paragraphText(p, { visible: true });
        const loc = `${where} paragraf ${i + 1}`;
        wrapperParas.push({ text, visible, location: loc });
        if (isCover && parseSpine(text)) return;
        if (STAMP_RE.test(norm(text))) return;
        if (firstRunCaps(doc, p)) {
          wl.push(item(text, visible, DOCPART, `${loc} (kicker)`, "kicker"));
          if (isCover) coverKickers.push({ text, visible, location: loc });
          if (TOC_TITLES.has(norm(visible).toUpperCase())) tocish = true;
        } else if (!isCover && BLOCK_HEADING_RE.test(norm(text))) {
          wl.push(item(text, visible, DOCPART, `${loc} (judul blok)`, "blockHeading"));
        }
      });
    // Tabel bukan pita segel.
    for (const t of doc.tables(s.blocks)) {
      if (sealTables.has(t) || ancestor(t, "w:tbl")) continue;
      const rows = doc.tableRows(t).map((tr) => doc.rowCells(tr));
      const loc = `${where} tabel`;
      if (isCover) {
        for (const cells of rows) {
          if (cells.length !== 4) continue;
          for (const k of [0, 2]) {
            const label = doc.cellText(cells[k]);
            if (!label.trim()) continue;
            wl.push(item(label, doc.cellText(cells[k], { visible: true }), DOCPART, `${loc} label blok kendali`, "controlLabel"));
            controlPairs.push({ label: norm(label), value: norm(doc.cellText(cells[k + 1])), location: `${loc} label blok kendali "${norm(label)}"` });
          }
        }
        continue;
      }
      frontTables.push({ rows: rows.map((cells) => cells.map((c) => doc.cellText(c))), location: loc });
      for (const c of rows[0] ?? []) {
        const text = doc.cellText(c);
        if (text.trim()) wl.push(item(text, doc.cellText(c, { visible: true }), DOCPART, `${loc} baris pertama`, "tableHead"));
      }
    }
    // Label entri daftar isi ("Bab 1", "Chapter 1", "Lampiran A").
    if (tocish && !isCover) {
      for (const p of doc.paragraphs(s.blocks)) {
        const text = doc.paragraphText(p);
        const head = norm(text.split("\t")[0]);
        if (CHAPTER_KICKER_RE.test(head) && (text.includes("\t") || ancestor(p, "w:tc"))) {
          wl.push(item(head, head, DOCPART, `${where} label daftar isi "${head}"`, "tocLabel"));
        }
      }
    }
  }

  // Seksi interior (WL 3).
  const chapterKickers: TextItem[] = [];
  const captions: TextItem[] = [];
  const apparatusLabels: TextItem[] = [];
  for (const s of layout.interiors) {
    const where = secName(s);
    const topLevel = new Set(s.blocks.filter((b) => b.name === "w:p"));
    for (const p of doc.paragraphs(s.blocks)) {
      const text = doc.paragraphText(p);
      if (!text.trim()) continue;
      const visible = doc.paragraphText(p, { visible: true });
      if (topLevel.has(p) && firstRunCaps(doc, p) && CHAPTER_KICKER_RE.test(norm(text))) {
        const it = item(text, visible, DOCPART, `${where} kicker bab "${norm(visible)}"`, "chapterKicker");
        chapterKickers.push(it);
        wl.push(it);
        continue;
      }
      const cap = CAPTION_RE.exec(norm(text));
      if (cap && firstRunCapsOrBold(doc, p)) {
        const word = cap[1];
        const it = item(word, word, DOCPART, `${where} keterangan "${norm(text).slice(0, 40)}"`, "caption");
        captions.push(it);
        wl.push(it);
      }
      for (const r of doc.runs(p)) {
        const rt = doc.runText(r);
        const label = rt.replace(LABEL_RUN_TRIM, "");
        if (CAPS_APPARATUS.has(label)) {
          const it = item(label, label, DOCPART, `${where} label aparatus "${label}"`, "apparatus");
          apparatusLabels.push(it);
          wl.push(it);
        }
      }
    }
  }

  const out: Analysis = {
    registers,
    interiorHeaderRights,
    sealCells,
    controlPairs,
    stamps,
    spines,
    coverKickers,
    wrapperParas,
    wl,
    allText,
    chapterKickers,
    captions,
    apparatusLabels,
    frontTables,
  };
  cache.set(doc, out);
  return out;
}

const A = (ctx: RuleContext): Analysis => analyse(ctx.docx, ctx.layout);
const E = (ctx: RuleContext) => LANGUAGE_EXPECTATIONS[ctx.pair.language];
const isTS = (ctx: RuleContext): boolean => ctx.pair.tier !== "NOTA";

// ── Nomor dokumen (CR-2, NU-02, NU-07, X-02) ────────────────────────────

interface NumberSite {
  readonly value: string;
  readonly location: string;
  readonly registerDate?: string;
}

const NUMBER_LABELS = new Set(LANGS.map((l) => LANGUAGE_EXPECTATIONS[l].numberLabel));
const REVISION_LABELS = new Set(LANGS.map((l) => LANGUAGE_EXPECTATIONS[l].revisionLabel));

function numberSites(ctx: RuleContext): NumberSite[] {
  const a = A(ctx);
  const out: NumberSite[] = [];
  for (const r of a.registers) {
    const c1 = norm(r.cells[0] ?? "");
    const m = /^\S+ · (.+)$/.exec(c1);
    out.push({ value: m ? m[1].trim() : c1, location: `${r.part} sel register 1`, registerDate: norm(r.cells[1] ?? "") });
  }
  if (isTS(ctx)) for (const cp of a.controlPairs) if (NUMBER_LABELS.has(cp.label)) out.push({ value: cp.value, location: cp.location });
  return out;
}

function diagnoseNumber(n: string): string {
  const loose = DOC_NUMBER_LOOSE_RE.exec(n);
  if (!loose) return `"${n}" tidak cocok pola NNN/GSP/<KODE>/<BULAN ROMAWI>/<TAHUN>`;
  const [, prefix, , org, code] = loose;
  if (prefix && FORBIDDEN_NUMBER_PREFIXES.includes(prefix)) return `"${n}" berawalan klasifikasi ${prefix}/ (ID:663)`;
  if (code === "DS") return `"${n}" memakai kode DS yang pensiun (ID:643, 661)`;
  if (org !== "GSP") return `"${n}" organisasi ${org}, bukan GSP`;
  if (!TYPE_CODES.includes(code)) return `"${n}" kode ${code} di luar daftar tertutup Rev A`;
  return `"${n}" tidak cocok pola NNN/GSP/<KODE>/<BULAN ROMAWI>/<TAHUN>`;
}

function numberCode(n: string): string | undefined {
  return DOC_NUMBER_LOOSE_RE.exec(n)?.[4];
}

// ── CR-2 ─────────────────────────────────────────────────────────────────

function checkCR2(ctx: RuleContext): RuleResult {
  const sites = numberSites(ctx);
  if (sites.length === 0) return fail("nomor dokumen tidak ditemukan (sel register 1 footer interior / blok kendali sampul)");
  const problems: string[] = [];
  for (const s of sites) {
    const m = DOC_NUMBER_RE.exec(s.value);
    if (!m) problems.push(`${s.location}: ${diagnoseNumber(s.value)}`);
    else if (m[1] !== ctx.pair.typeCode) problems.push(`${s.location}: kode ${m[1]} != kode pasangan ${ctx.pair.typeCode}`);
  }
  const distinct = [...new Set(sites.map((s) => s.value))];
  if (distinct.length > 1) problems.push(`nomor berbeda antar lokasi: ${distinct.map((d) => `"${d}"`).join(", ")}`);
  const observed = distinct.join(" | ");
  if (problems.length) return fail(problems.slice(0, MAX_LISTED).join("; "), { location: sites[0].location, observed });
  return pass(`nomor "${distinct[0]}" cocok pola, kode ${ctx.pair.typeCode}, sama di ${sites.length} lokasi`, { location: sites[0].location, observed });
}

// ── CR-3 ─────────────────────────────────────────────────────────────────

interface NumberHit {
  readonly match: string;
  readonly why: string;
  readonly location: string;
}

function scanNumbers(doc: DocxDocument, conv: NumberConvention, label: string): NumberHit[] {
  const out: NumberHit[] = [];
  const parts = doc.textPartNames().map((p) => ({ p, root: doc.part(p) }));
  const whole = parts.map((x) => (x.root ? doc.text(x.root) : "")).join("\n");
  const exempt = conv.allowIdrLine !== undefined && whole.includes(conv.allowIdrLine);
  for (const { p, root } of parts) {
    if (!root) continue;
    let text = doc.text(root).replace(/\b(?:[A-Z]{1,2}\/)?(?:\d+|X+)\/[A-Z]+\/[A-Z]+\/[IVX]+\/\d{4}\b/g, " ");
    for (const ex of NUMBER_SCAN_EXCLUSIONS) text = text.replace(ex, " ");
    for (const f of conv.forbidden) {
      if (f.exemptByAllowLine && exempt) continue;
      for (const m of text.matchAll(f.re)) out.push({ match: m[0], why: f.why, location: `${label} ${p}` });
    }
  }
  return out;
}

/** String angka harapan B-FIX sebagai token utuh (tidak menempel digit/pemisah lain). */
function hasNumberToken(text: string, expected: string): boolean {
  return new RegExp(`(?<![\\d.,])${escapeRe(expected)}(?![\\d]|[.,]\\d)`).test(text);
}

function checkCR3(ctx: RuleContext): RuleResult {
  const conv = E(ctx).numbers;
  const hits = scanNumbers(ctx.docx, conv, "sampel");
  if (!ctx.bfix) {
    const note = hits.length ? `; sampel juga melanggar: ${hits.slice(0, 3).map((h) => `"${h.match}" (${h.why})`).join(", ")}` : "";
    return unexercised(`fiksur B-FIX tidak diberikan (--bfix, research/32 §10; research/31 F-5)${note}`);
  }
  hits.push(...scanNumbers(ctx.bfix, conv, "B-FIX"));
  const bfixText = ctx.bfix.textPartNames().map((p) => {
    const root = ctx.bfix!.part(p);
    return root ? ctx.bfix!.text(root) : "";
  }).join("\n");
  const missing = conv.bfixExpected.filter((s) => !hasNumberToken(bfixText, s));
  const problems = [
    ...hits.slice(0, MAX_LISTED).map((h) => `${h.location}: "${h.match}" (${h.why})`),
    ...(missing.length ? [`B-FIX tanpa string harapan ${ctx.pair.language}: ${missing.map((m) => `"${m}"`).join(", ")}`] : []),
  ];
  if (problems.length) return fail(problems.join("; "), { observed: hits[0]?.match ?? missing[0] });
  return pass(`konvensi ${ctx.pair.language} terpenuhi di sampel dan B-FIX; harapan B-FIX ${conv.bfixExpected.map((s) => `"${s}"`).join(", ")} ada`);
}

// ── CR-4, AC6-03, X-01 ──────────────────────────────────────────────────

function hasWord(text: string, word: string): boolean {
  return tokenRe(word).test(text);
}

function markerProblems(ctx: RuleContext): string[] {
  const a = A(ctx);
  const e = E(ctx);
  const out: string[] = [];
  if (a.registers.length === 0) out.push("tabel register footer interior tidak ditemukan (penanda kata register)");
  for (const r of a.registers) {
    const c3 = r.cells[2] ?? "";
    for (const w of e.registerWords) if (!hasWord(c3, w)) out.push(`${r.part} sel register 3 tanpa "${w}" (teramati "${norm(c3)}")`);
  }
  if (!isTS(ctx)) return out;
  if (a.sealCells.length === 0) out.push("pita segel tidak ditemukan");
  for (const s of a.sealCells) {
    if (!norm(s.left).startsWith(e.sealLeftPrefix.trim())) out.push(`${s.location} kiri tanpa awalan "${e.sealLeftPrefix}" (teramati "${norm(s.left)}")`);
    if (!ctx.pair.hasCopyControl && norm(s.right) !== e.sealRightDefault) out.push(`${s.location} kanan != "${e.sealRightDefault}" (teramati "${norm(s.right)}")`);
  }
  if (!a.stamps.some((s) => s.dash === "--" && s.word === e.issueWord)) {
    out.push(`cap terbit tanpa " -- ${e.issueWord} " (teramati ${a.stamps.map((s) => `"${norm(s.text)}"`).join(", ") || "tidak ada"})`);
  }
  const paras = a.wrapperParas.map((p) => norm(p.text));
  if (!paras.some((t) => t === e.controlSheetKicker || t.startsWith(`${e.controlSheetKicker} `))) out.push(`kicker lembar kendali "${e.controlSheetKicker}" tidak ada`);
  if (!a.wrapperParas.some((p) => norm(p.visible).toUpperCase() === e.tocTitle.toUpperCase())) out.push(`judul daftar isi "${e.tocTitle}" tidak ada`);
  if (!a.controlPairs.some((c) => c.label === e.preparerLabel)) out.push(`label blok kendali "${e.preparerLabel}" tidak ada`);
  return out;
}

function checkCR4(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const own = E(ctx);
  const foreign = LANGUAGE_EXPECTATIONS[otherLang(ctx.pair.language)];
  const scope = foreign.criticalScope === "document" ? a.allText : a.wl;
  const tokenHits = findTokens(scope, foreign.criticalTokens);
  const apparatusHits = own.foreignApparatusCritical ? findTokens(a.wl, foreign.apparatus) : [];
  const markers = markerProblems(ctx);
  const problems: string[] = [];
  if (tokenHits.length) problems.push(`token ${otherLang(ctx.pair.language)} (${foreign.criticalScope === "document" ? "seluruh teks" : "teks pembungkus"}): ${listHits(tokenHits)}`);
  if (apparatusHits.length) problems.push(`label aparatus ${otherLang(ctx.pair.language)} di pembungkus (D-598 F-2): ${listHits(apparatusHits)}`);
  if (markers.length) problems.push(`penanda ${ctx.pair.language} wajib: ${markers.slice(0, MAX_LISTED).join("; ")}`);
  const first = tokenHits[0] ?? apparatusHits[0];
  if (problems.length) return fail(problems.join(" | "), { part: first?.item.part, location: first?.item.location, observed: first?.token });
  return pass(`0 token ${otherLang(ctx.pair.language)} di ${scope.length} ${foreign.criticalScope === "document" ? "paragraf" : "lokasi pembungkus"}; penanda ${ctx.pair.language} lengkap`);
}

function checkAC603(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const foreign = LANGUAGE_EXPECTATIONS[otherLang(ctx.pair.language)];
  const hits = findTokens(a.wl, foreign.extensionTokens);
  if (hits.length) return fail(`token perluasan ${otherLang(ctx.pair.language)} di pembungkus: ${listHits(hits)}`, { part: hits[0].item.part, location: hits[0].item.location, observed: hits[0].token });
  return pass(`0 token perluasan ${otherLang(ctx.pair.language)} di ${a.wl.length} lokasi pembungkus`);
}

function langTokens(lang: Lang): LangToken[] {
  const e = LANGUAGE_EXPECTATIONS[lang];
  return [...e.criticalTokens, ...e.extensionTokens, ...e.apparatus];
}

function wrapperLanguageHits(ctx: RuleContext): Record<Lang, Hit[]> {
  const a = A(ctx);
  return { ID: findTokens(a.wl, langTokens("ID")), EN: findTokens(a.wl, langTokens("EN")) };
}

function checkX01(ctx: RuleContext): RuleResult {
  const h = wrapperLanguageHits(ctx);
  if (h.ID.length && h.EN.length) {
    return fail(`teks pembungkus dua bahasa: ID ${listHits(h.ID.slice(0, 3))} | EN ${listHits(h.EN.slice(0, 3))}`, { location: h.EN[0].item.location, observed: `${h.ID[0].token} + ${h.EN[0].token}` });
  }
  return pass(`teks pembungkus satu bahasa (token ID ${h.ID.length}, token EN ${h.EN.length})`);
}

// ── Kicker dan kode jenis (X-02, X-03, NU-02) ───────────────────────────

const KICKER_NAMES: readonly { name: string; type: string }[] = Object.entries(KICKERS_BY_TYPE)
  .flatMap(([type, m]) => LANGS.map((l) => ({ name: m[l], type })))
  .sort((x, y) => y.name.length - x.name.length);

/** Nama jenis kicker di teks, pencocokan kata utuh terpanjang tanpa tumpang. */
function kickerNames(visible: string): { name: string; type: string }[] {
  const s = norm(visible).toUpperCase();
  const taken: [number, number][] = [];
  const out: { name: string; type: string; at: number }[] = [];
  for (const k of KICKER_NAMES) {
    const re = new RegExp(tokenRe(k.name).source, "gu");
    for (const m of s.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (taken.some(([a, b]) => start < b && end > a)) continue;
      taken.push([start, end]);
      out.push({ ...k, at: start });
    }
  }
  return out.sort((x, y) => x.at - y.at);
}

function checkX02(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const sources: string[] = [];
  const codes = new Set<string>();
  for (const s of numberSites(ctx)) {
    const c = numberCode(s.value);
    if (c) {
      codes.add(c);
      sources.push(`${c} (nomor, ${s.location})`);
    }
  }
  for (const sp of a.spines) {
    if (sp.type) {
      codes.add(sp.type);
      sources.push(`${sp.type} (string punggung)`);
    }
  }
  for (const k of a.coverKickers) {
    for (const n of kickerNames(k.visible)) {
      codes.add(n.type);
      sources.push(`${n.type} (kicker "${n.name}")`);
    }
  }
  if (codes.size > 1) return fail(`kode jenis bertentangan: ${sources.join(", ")}`, { observed: [...codes].join(" vs ") });
  return pass(sources.length ? `kode jenis tunggal ${[...codes][0]} dari ${sources.length} sumber` : "tidak ada sumber kode jenis di pembungkus");
}

function checkX03(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  for (const k of a.coverKickers) {
    const names = [...new Set(kickerNames(k.visible).map((n) => n.name))];
    if (names.length > 1) return fail(`kicker sampul memuat ${names.length} nama jenis: ${names.join(", ")}`, { location: k.location, observed: norm(k.visible) });
  }
  return pass(`kicker sampul memuat paling banyak satu nama jenis (${a.coverKickers.length} paragraf kicker diperiksa)`);
}

function checkNU02(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const sites = numberSites(ctx);
  if (sites.length === 0) return fail("nomor dokumen tidak ditemukan");
  const problems: string[] = [];
  for (const s of sites) {
    const c = numberCode(s.value);
    if (c !== ctx.pair.typeCode) problems.push(`${s.location}: kode ${c ?? "?"} != ${ctx.pair.typeCode}`);
  }
  if (isTS(ctx)) {
    if (a.spines.length === 0) problems.push("string punggung sampul tidak ditemukan");
    for (const sp of a.spines) if (sp.jenis !== ctx.pair.typeCode) problems.push(`${sp.location}: jenis "${sp.jenis}" != ${ctx.pair.typeCode}`);
  }
  if (problems.length) return fail(problems.join("; "));
  return pass(`kode ${ctx.pair.typeCode} sama di nomor (${sites.length} lokasi)${isTS(ctx) ? " dan string punggung" : ""}`);
}

// ── NU-03 (tabel spec) ───────────────────────────────────────────────────

interface SpecRow {
  readonly slug: string;
  readonly params: Readonly<Record<string, unknown>>;
}

function specRows(spec: unknown): SpecRow[] | string {
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  const toRow = (v: unknown, i: number): SpecRow | string =>
    isObj(v) && typeof v.slug === "string" && isObj(v.params) ? { slug: v.slug, params: v.params } : `baris ${i} bukan { slug, params }`;
  let raw: unknown[];
  if (isObj(spec) && Array.isArray(spec.templates)) raw = spec.templates;
  else if (isObj(spec) && typeof spec.slug === "string") raw = [spec];
  else return "spec bukan { templates: [...] } atau { slug, params }";
  const rows: SpecRow[] = [];
  for (const [i, v] of raw.entries()) {
    const r = toRow(v, i);
    if (typeof r === "string") return r;
    rows.push(r);
  }
  return rows;
}

function checkNU03(ctx: RuleContext): RuleResult {
  if (ctx.spec === undefined) return unexercised("tabel spec templat tidak diberikan (--spec)");
  const rows = specRows(ctx.spec);
  if (typeof rows === "string") return fail(`spec tidak sah: ${rows}`);
  const row = rows.find((r) => r.slug === ctx.pair.slug);
  if (!row) return fail(`spec tanpa baris slug ${ctx.pair.slug} (${rows.length} baris)`);
  const p = row.params;
  const problems: string[] = [];
  const codes = p["doc.typeCode"];
  if (!Array.isArray(codes) || !codes.every((c) => typeof c === "string")) problems.push("doc.typeCode bukan daftar string");
  else {
    if (codes.includes("DS")) problems.push("doc.typeCode memuat DS (pensiun, ID:643, 661)");
    if (!codes.includes("NDA")) problems.push("doc.typeCode tanpa NDA");
    if (codes.length !== TYPE_CODES.length || codes.some((c, i) => c !== TYPE_CODES[i])) problems.push(`doc.typeCode [${codes.join(",")}] != [${TYPE_CODES.join(",")}]`);
  }
  const expect: [string, unknown][] = [
    ["doc.defaultTypeCode", ctx.pair.typeCode],
    ["doc.defaultTier", ctx.pair.tier],
    ["doc.language", ctx.pair.language],
    ["cover.kicker.text", ctx.pair.kicker],
  ];
  for (const [k, v] of expect) if (p[k] !== v) problems.push(`${k} = ${JSON.stringify(p[k])} != ${JSON.stringify(v)}`);
  if (problems.length) return fail(`spec ${row.slug}: ${problems.join("; ")}`);
  return pass(`spec ${row.slug}: doc.typeCode = daftar Rev A (14 kode, NDA, tanpa DS); kode, tier, bahasa, kicker = pasangan`);
}

// ── NU-05, NU-07, NC-04 ─────────────────────────────────────────────────

function revisionTable(ctx: RuleContext): { rows: readonly (readonly string[])[]; location: string } | undefined {
  return A(ctx).frontTables.find((t) => norm(t.rows[0]?.[0] ?? "") === REVISION_TABLE_HEAD);
}

function checkNU05(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const tokens: { value: string; location: string }[] = [];
  for (const r of a.registers) {
    const m = /^REV (\S+)/.exec(norm(r.cells[1] ?? ""));
    tokens.push({ value: m ? m[1] : "", location: `${r.part} sel register 2` });
  }
  const rt = revisionTable(ctx);
  if (rt && rt.rows.length > 1) tokens.push({ value: norm(rt.rows[rt.rows.length - 1][0] ?? ""), location: `${rt.location} riwayat revisi baris terakhir` });
  if (tokens.length === 0) return unexercised("tidak ada sel register maupun riwayat revisi");
  const bad = tokens.filter((t) => t.value === "" || /\d+[.,]\d+/.test(t.value));
  if (bad.length) return fail(`revisi tidak sah: ${bad.map((b) => `${b.location} "${b.value}"`).join("; ")}`, { location: bad[0].location, observed: bad[0].value });
  return pass(`revisi tanpa desimal: ${[...new Set(tokens.map((t) => t.value))].join(", ")}`);
}

function checkNU07(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  if (a.registers.length === 0) return unexercised("tabel register footer interior tidak ditemukan");
  const problems: string[] = [];
  for (const s of numberSites(ctx)) {
    if (s.registerDate === undefined) continue;
    const n = DOC_NUMBER_LOOSE_RE.exec(s.value);
    const d = /(\d{2})-([IVX]+)-(\d{4})/.exec(s.registerDate);
    if (!n) problems.push(`${s.location}: nomor "${s.value}" tak terurai`);
    else if (!d) problems.push(`${s.location}: tanggal register tak terurai ("${s.registerDate}")`);
    else if (n[5] !== d[2] || n[6] !== d[3]) problems.push(`${s.location}: nomor ${n[5]}/${n[6]} != tanggal ${d[2]}-${d[3]}`);
  }
  if (problems.length) return fail(problems.join("; "));
  return pass(`bulan Romawi dan tahun nomor = tanggal register di ${a.registers.length} footer`);
}

function checkNC04(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const field = a.controlPairs.find((c) => REVISION_LABELS.has(c.label));
  if (!field) return fail("medan REVISI blok kendali sampul tidak ditemukan");
  const m = /^.+ · (\d{1,2}) (\S+) (\d{4})$/.exec(field.value);
  if (!m) return fail(`nilai REVISI "${field.value}" tidak cocok "<rev> · <tgl> <bulan> <tahun>"`, { location: field.location, observed: field.value });
  if (!E(ctx).months.includes(m[2])) return fail(`bulan "${m[2]}" bukan nama bulan ${ctx.pair.language}`, { location: field.location, observed: field.value });
  return pass(`tanggal panjang "${field.value}" bernama bulan ${ctx.pair.language}`, { location: field.location, observed: field.value });
}

// ── LB ───────────────────────────────────────────────────────────────────

function checkLB01(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const e = E(ctx);
  if (a.controlPairs.length === 0) return fail("blok kendali sampul (tabel 4 sel) tidak ditemukan");
  const allowed = new Set(e.coverControlLabels);
  const bad = a.controlPairs.filter((c) => !allowed.has(c.label));
  const problems = bad.map((c) => `label "${c.label}" bukan label ${ctx.pair.language}`);
  if (!a.controlPairs.some((c) => c.label === e.preparerLabel)) problems.push(`label penyusun "${e.preparerLabel}" tidak ada`);
  if (problems.length) return fail(problems.join("; "), { location: bad[0]?.location, observed: bad[0]?.label });
  return pass(`${a.controlPairs.length} label blok kendali ${ctx.pair.language}: ${a.controlPairs.map((c) => c.label).join(", ")}`);
}

function checkLB02(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const e = E(ctx);
  const foreign = LANGUAGE_EXPECTATIONS[otherLang(ctx.pair.language)].tocTitle.toUpperCase();
  const toc = ctx.layout.toc;
  const scope = toc ? a.wrapperParas.filter((p) => p.location.startsWith(`seksi ${toc.index} `)) : a.wrapperParas.filter((p) => !p.location.includes("cover") && !p.location.includes("controlSheet"));
  const own = scope.filter((p) => norm(p.visible).toUpperCase() === e.tocTitle.toUpperCase());
  const other = scope.filter((p) => norm(p.visible).toUpperCase() === foreign);
  const where = toc ? `seksi DAFTAR ISI ${toc.index}` : "seksi pembungkus selain sampul/lembar kendali (tanpa medan TOC)";
  if (own.length === 1 && other.length === 0) return pass(`satu judul "${e.tocTitle}" di ${where}`, { location: own[0].location });
  return fail(`${where}: judul "${e.tocTitle}" ${own.length}x, judul bahasa lain ${other.length}x`, { location: (other[0] ?? own[0])?.location, observed: other[0]?.text });
}

function checkLB03(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  if (a.chapterKickers.length === 0) return na("tidak ada kicker pembuka bab (judul bab membawa nomor sumber)");
  const words = E(ctx).chapterKickerWords;
  const bad = a.chapterKickers.filter((k) => !words.includes(norm(k.visible).split(" ")[0]));
  if (bad.length) return fail(`kicker bab bukan ${words.join("/")}: ${bad.map((b) => `"${norm(b.visible)}"`).join(", ")}`, { location: bad[0].location, observed: norm(bad[0].visible) });
  return pass(`${a.chapterKickers.length} kicker bab ${words.join("/")}`);
}

function checkLB06(ctx: RuleContext): RuleResult {
  if (ctx.pair.producedBy !== "mcp") return na("sampel r08: peran tanda tangan bukan label klien MCP");
  const roles: { role: string; location: string }[] = [];
  for (const t of A(ctx).frontTables) {
    const first = (t.rows[0] ?? []).map(norm).filter((c) => c !== "");
    if (first.length && first.every((c) => ROLE_VOCAB.has(c))) for (const r of first) roles.push({ role: r, location: t.location });
  }
  if (roles.length === 0) return fail("blok tanda tangan (sel peran) tidak ditemukan");
  const allowed = E(ctx).signatureRoles;
  const bad = roles.filter((r) => !allowed.includes(r.role));
  if (bad.length) return fail(`peran tanda tangan bukan ${ctx.pair.language}: ${bad.map((b) => `"${b.role}"`).join(", ")}`, { location: bad[0].location, observed: bad[0].role });
  return pass(`peran tanda tangan ${ctx.pair.language}: ${roles.map((r) => r.role).join(", ")}`);
}

function checkLB09(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const e = E(ctx);
  const artifactVocab = new Set(LANGS.flatMap((l) => LANGUAGE_EXPECTATIONS[l].artifactWords));
  const runVocab = new Set(LANGS.flatMap((l) => LANGUAGE_EXPECTATIONS[l].runLabels));
  const caps = a.captions.filter((c) => artifactVocab.has(c.text.toUpperCase()));
  const labels = a.apparatusLabels.filter((l) => runVocab.has(l.text));
  if (caps.length + labels.length === 0) return na("tidak ada keterangan tabel/gambar/turunan maupun label sumber/provenans/kunci");
  const bad = [...caps.filter((c) => !e.artifactWords.includes(c.text.toUpperCase())), ...labels.filter((l) => !e.runLabels.includes(l.text))];
  if (bad.length) return fail(`label aparatus bukan ${ctx.pair.language}: ${bad.slice(0, MAX_LISTED).map((b) => `"${b.text}" @ ${b.location}`).join("; ")}`, { location: bad[0].location, observed: bad[0].text });
  return pass(`${caps.length} keterangan dan ${labels.length} label aparatus berbahasa ${ctx.pair.language}`);
}

function checkLB10(ctx: RuleContext): RuleResult {
  if (ctx.pair.producedBy !== "mcp" || ctx.pair.agentRevisionText) return na("catatan revisi dari agen atau sampel r08");
  const rt = revisionTable(ctx);
  if (!rt || rt.rows.length < 2) return fail("tabel riwayat revisi dengan baris data tidak ditemukan");
  const note = norm(rt.rows[1][2] ?? "");
  const want = E(ctx).firstIssueNote;
  if (note !== want) return fail(`catatan revisi baris pertama "${note}" != "${want}"`, { location: rt.location, observed: note });
  return pass(`catatan revisi bawaan "${want}"`, { location: rt.location });
}

function checkLB11(ctx: RuleContext): RuleResult {
  if (ctx.pair.producedBy !== "mcp") return na("sampel r08: peran rantai verifikasi bukan label klien MCP");
  const heads = new Set(LANGS.map((l) => LANGUAGE_EXPECTATIONS[l].verificationHead));
  const t = A(ctx).frontTables.find((x) => heads.has(norm(x.rows[0]?.[0] ?? "")));
  if (!t) return fail("tabel rantai verifikasi tidak ditemukan");
  const roles = t.rows.slice(1).map((r) => norm(r[1] ?? "")).filter((r) => r !== "");
  if (roles.length === 0) return fail("tabel rantai verifikasi tanpa peran", { location: t.location });
  const allowed = E(ctx).verificationRoles;
  const bad = roles.filter((r) => !allowed.includes(r));
  if (bad.length) return fail(`peran rantai verifikasi bukan ${ctx.pair.language}: ${bad.map((b) => `"${b}"`).join(", ")}`, { location: t.location, observed: bad[0] });
  return pass(`peran rantai verifikasi ${ctx.pair.language}: ${roles.join(", ")}`, { location: t.location });
}

// ── X-04, X-05 ──────────────────────────────────────────────────────────

const SEAL_PREFIXES: readonly string[] = LANGS.map((l) => LANGUAGE_EXPECTATIONS[l].sealLeftPrefix.trim());

function checkX04(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const values: { value: string; where: string }[] = [];
  const k = (s: string) => norm(s).toUpperCase();
  for (const s of a.sealCells) {
    const left = norm(s.left);
    const prefix = SEAL_PREFIXES.find((p) => left.startsWith(p));
    if (prefix) values.push({ value: k(left.slice(prefix.length)), where: s.location });
  }
  for (const h of a.interiorHeaderRights) values.push({ value: k(h.value), where: `${h.part} kanan` });
  for (const r of a.registers) if (r.cells[3] !== undefined) values.push({ value: k(r.cells[3]), where: `${r.part} sel register 4` });
  const distinct = [...new Set(values.map((v) => v.value).filter((v) => v !== ""))];
  if (distinct.length > 1) return fail(`klasifikasi berbeda: ${distinct.map((d) => `"${d}" (${values.find((v) => v.value === d)!.where})`).join(", ")}`, { observed: distinct.join(" vs ") });
  return pass(distinct.length ? `klasifikasi tunggal "${distinct[0]}" di ${values.length} lokasi` : "tidak ada nilai klasifikasi pembungkus");
}

function checkX05(ctx: RuleContext): RuleResult {
  const a = A(ctx);
  const h = wrapperLanguageHits(ctx);
  const wlLang: Lang | undefined = h.ID.length && !h.EN.length ? "ID" : h.EN.length && !h.ID.length ? "EN" : undefined;
  const codes: { code: string; where: string }[] = [];
  for (const s of a.stamps) codes.push({ code: s.lang, where: `cap terbit (${s.location})` });
  for (const sp of a.spines) codes.push({ code: sp.lang, where: `string punggung (${sp.location})` });
  if (wlLang) codes.push({ code: wlLang, where: "bahasa teks pembungkus" });
  const distinct = [...new Set(codes.map((c) => c.code))];
  if (distinct.length > 1) return fail(`kode bahasa bertentangan: ${codes.map((c) => `${c.code} = ${c.where}`).join(", ")}`, { observed: distinct.join(" vs ") });
  return pass(codes.length ? `kode bahasa tunggal ${distinct[0]} (${codes.map((c) => c.where).join(", ")})` : "tidak ada kode bahasa pembungkus");
}

export const rules: readonly Rule[] = [
  defineRule("CR-2", checkCR2),
  defineRule("CR-3", checkCR3),
  defineRule("CR-4", checkCR4),
  defineRule("NU-02", checkNU02),
  defineRule("NU-03", checkNU03),
  defineRule("NU-05", checkNU05),
  defineRule("NU-07", checkNU07),
  defineRule("NC-04", checkNC04),
  defineRule("AC6-03", checkAC603),
  defineRule("LB-01", checkLB01),
  defineRule("LB-02", checkLB02),
  defineRule("LB-03", checkLB03),
  defineRule("LB-06", checkLB06),
  defineRule("LB-09", checkLB09),
  defineRule("LB-10", checkLB10),
  defineRule("LB-11", checkLB11),
  defineRule("X-01", checkX01),
  defineRule("X-02", checkX02),
  defineRule("X-03", checkX03),
  defineRule("X-04", checkX04),
  defineRule("X-05", checkX05),
];
