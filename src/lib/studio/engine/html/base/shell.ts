/**
 * Kerangka dokumen HTML (S21; I10 `htmlShell`): `<!DOCTYPE>`, `<head>` dengan
 * CSS fon + token + perabot halaman, `<body>` berkelas moda rel.
 *
 * Masukan badan berasal dari perakit S24 (D-45): unit alir
 * `<section class="st-unit st-unit-<kind>" data-unit data-unit-key
 * [data-header] [data-footer]>`. Untuk setiap unit, `htmlShell`:
 * - menyusun halaman `@page` bernama (`st-u-<i>`) dengan kotak margin running
 *   head (kiri entitas/jenis, tengah "BAB n · judul" dari kepala bab S22,
 *   kanan klasifikasi) dan blok register "LEMBAR counter(page) DARI
 *   counter(pages)" sesuai mode `data-header`/`data-footer`;
 * - menyisipkan salinan perabot `.st-screen` (tampil hanya di layar) tepat
 *   setelah tag pembuka unit.
 * Lembar `.page` (mode berhalaman, `pageSheet`) memakai halaman `st-sheet`
 * bermargin nol; perabotnya ada di markup lembar itu sendiri.
 *
 * Tanpa skrip dan tanpa URL: CSS fon yang masuk diperiksa (hanya `data:`),
 * nilai teks masuk CSS lewat `cssString` dan masuk HTML lewat `esc`.
 */
import type { DocMeta, ResolvedTemplate } from "../../../contract";
import { StudioEngineError } from "../../../contract/errors";
import { railModeFor } from "../../tokens";
import { railK2ReserveOf } from "../../docx/blocks/rail";
import { buildTokenCss, fontStack, typeSpec } from "./css";
import { cssString } from "./fonts";
import { esc, registerCellParts, registerFieldValue, registerHtml, runningHeadHtml, runningHeadText, type RunningHeadText } from "./markup";
import { classificationColour, colour, mm, num, P, pageGeometry, pt, r4, record } from "./params";

/** Jenis unit berpalet pembungkus (R-09 `render.section.wrapper`). */
const WRAPPER_KINDS = new Set(["cover", "controlSheet", "part"]);

type HeaderMode = "runningHead" | "none";
type FooterMode = "registerBlock" | "none";

export interface ShellUnit {
  index: number;
  kind: string;
  key?: string;
  header: HeaderMode;
  footer: FooterMode;
  center: string;
  wrapper: boolean;
  /** Posisi akhir tag pembuka di `bodyHtml`. */
  openEnd: number;
}

const ATTR_RE = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g;

function attrsOf(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(ATTR_RE)) out[m[1].toLowerCase()] = m[2];
  return out;
}

function hasClass(attrs: Record<string, string>, cls: string): boolean {
  return (attrs.class ?? "").split(/\s+/).includes(cls);
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Teks polos dari potongan HTML yang sudah di-escape (tag dibuang, entitas diurai, spasi dipadatkan). */
export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e: string) => {
      if (e[0] === "#") {
        const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
      }
      return NAMED_ENTITIES[e] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Teks elemen pertama berkelas `cls` di potongan (tag penutup = tag pembuka yang sama, tanpa sarang sejenis). */
function firstText(slice: string, cls: string): string {
  const re = new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*\\bclass="(?:[^"]*\\s)?${cls}(?:\\s[^"]*)?"[^>]*>`, "g");
  const m = re.exec(slice);
  if (!m) return "";
  const start = m.index + m[0].length;
  const end = slice.indexOf(`</${m[1]}`, start);
  return htmlToText(slice.slice(start, end < 0 ? undefined : end));
}

/** Mode seksi templat (`render.section.wrapper|interior`) untuk `inherit`/absen. */
function templateModes(tpl: ResolvedTemplate, wrapper: boolean): { header: string; footer: string } {
  const s = record(tpl.params[wrapper ? P.sectionWrapper : P.sectionInterior]);
  const h = record(s?.header)?.mode;
  const f = record(s?.footer)?.mode;
  return {
    header: typeof h === "string" ? h : wrapper ? "empty" : "runningHead",
    footer: typeof f === "string" ? f : wrapper ? "empty" : "registerBlock",
  };
}

/** Pindai unit `.st-unit` (S24) di badan. Mode `custom` diperlakukan kosong (isi kustom tidak dirender di HTML). */
export function scanUnits(tpl: ResolvedTemplate, bodyHtml: string): ShellUnit[] {
  // P4S-10 blok register dimatikan -> tidak ada register di unit mana pun.
  const registerOn = tpl.params[P.registerEnabled] !== false;
  const opens: Array<{ attrs: Record<string, string>; start: number; end: number }> = [];
  for (const m of bodyHtml.matchAll(/<section\b[^>]*>/g)) {
    const attrs = attrsOf(m[0]);
    if (hasClass(attrs, "st-unit")) opens.push({ attrs, start: m.index, end: m.index + m[0].length });
  }
  return opens.map((o, i) => {
    const kind = o.attrs["data-unit"] ?? "";
    const wrapper = WRAPPER_KINDS.has(kind);
    const tm = templateModes(tpl, wrapper);
    const hRaw = o.attrs["data-header"] && o.attrs["data-header"] !== "inherit" ? o.attrs["data-header"] : tm.header;
    const fRaw = o.attrs["data-footer"] && o.attrs["data-footer"] !== "inherit" ? o.attrs["data-footer"] : tm.footer;
    const slice = bodyHtml.slice(o.end, i + 1 < opens.length ? opens[i + 1].start : undefined);
    const center = [firstText(slice, "st-chapter-kicker"), firstText(slice, "st-chapter-title")].filter(Boolean).join(" · ");
    return {
      index: i,
      kind,
      key: o.attrs["data-unit-key"] ? htmlToText(o.attrs["data-unit-key"]) : undefined,
      header: hRaw === "runningHead" ? "runningHead" : "none",
      footer: registerOn && fRaw === "registerBlock" ? "registerBlock" : "none",
      center,
      wrapper,
      openEnd: o.end,
    };
  });
}

/** Jumlah lembar galai/berhalaman: elemen `.page` + unit `.st-unit` (keduanya menaikkan penghitung `st-sheet`). */
export function countSheets(bodyHtml: string): number {
  let n = 0;
  for (const m of bodyHtml.matchAll(/<[a-zA-Z][a-zA-Z0-9]*\b[^>]*\bclass="([^"]*)"[^>]*>/g)) {
    const cls = m[1].split(/\s+/);
    if (cls.includes("page") || cls.includes("st-unit")) n++;
  }
  return n;
}

/** Jumlah sitasi rel (S22 `.st-rail`, RL `.r`) untuk moda rel `auto` (KT-07). */
export function countRailCitations(bodyHtml: string): number {
  let n = 0;
  for (const m of bodyHtml.matchAll(/\bclass="([^"]*)"/g)) {
    const cls = m[1].split(/\s+/);
    if (cls.includes("st-rail") || cls.includes("r")) n++;
  }
  return n;
}

const BOXES = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] as const;
type Box = (typeof BOXES)[number];

/** Isi kotak register: sel ber-{n} di tengah, sel terakhir di kanan, sisanya digabung di kiri. */
function registerBoxes(tpl: ResolvedTemplate, meta: DocMeta): Partial<Record<Box, string>> {
  const cells = registerCellParts(tpl, meta.language).map((parts) =>
    parts
      .map((part) => {
        if ("text" in part) return cssString(part.text);
        if (part.field === "n") return "counter(page)";
        if (part.field === "N") return "counter(pages)";
        return cssString(registerFieldValue(meta, part.field, tpl));
      })
      .join(" "),
  );
  const parts = registerCellParts(tpl, meta.language);
  if (cells.length === 0) return {};
  const last = cells.length - 1;
  const centerIdx = parts.findIndex((c, i) => i !== last && c.some((x) => "field" in x && x.field === "n"));
  const left = cells.filter((_, i) => i !== last && i !== centerIdx);
  const out: Partial<Record<Box, string>> = {};
  // Pemisah antarsel di kotak gabungan: spasi em (P4S-12 `separator` untuk sel DOCX; HTML memakai jarak kolom).
  if (left.length > 0) out["bottom-left"] = left.join(' "\\2003" ');
  if (centerIdx >= 0) out["bottom-center"] = cells[centerIdx];
  if (cells.length > 1 || centerIdx < 0) out["bottom-right"] = cells[last];
  return out;
}

function boxDecl(box: Box, content: string | undefined, styles: Record<"top" | "bottom" | "class", string>): string {
  if (content === undefined) return `@${box}{content:none}`;
  const base = box.startsWith("top") ? styles.top : styles.bottom;
  const extra = box === "top-right" || box === "bottom-right" ? styles.class : "";
  const align = box.endsWith("left") ? "left" : box.endsWith("right") ? "right" : "center";
  return `@${box}{content:${content};${base}${extra}text-align:${align}}`;
}

/** CSS halaman dinamis: properti dokumen, halaman `@page` per unit, kotak margin. */
export function pageFurnitureCss(tpl: ResolvedTemplate, meta: DocMeta, units: readonly ShellUnit[], sheets: number): string {
  const g = pageGeometry(tpl);
  const p = tpl.params;
  const rh = typeSpec(tpl, "runningHead");
  const rb = typeSpec(tpl, "registerBlock");
  const track = num(p, P.trackMicro) ?? 0.09;
  const classInk = classificationColour(tpl, meta);
  const styles = {
    // Running head: tepi atas teks pada `--hdr` dari tepi lembar (acuan RL 13 mm).
    top:
      `vertical-align:top;padding-top:${mm(g.headerMm)};font-family:${fontStack(tpl, rh.role)};font-size:${pt(rh.sizePt ?? 6.8)};` +
      `font-weight:${rh.weight};letter-spacing:${r4(track)}em;text-transform:${rh.upper ? "uppercase" : "none"};` +
      `color:${rh.colour ?? colour(tpl, "ink400", "6B7783")};`,
    // Register: kotak 8,5 mm (RL) yang tepi bawahnya `--ftr` dari tepi bawah lembar.
    bottom:
      `vertical-align:top;padding-top:${mm(Math.max(0, g.bottom - g.footerMm - 8.5) + 1.55)};font-family:${fontStack(tpl, rb.role)};` +
      `font-size:${pt(rb.sizePt ?? 6.2)};font-weight:${rb.weight};letter-spacing:.02em;color:${rb.colour ?? colour(tpl, "ink400", "6B7783")};`,
    class: `color:${classInk};font-weight:600;`,
  };
  const docRh = runningHeadText(tpl, meta);
  const reg = registerBoxes(tpl, meta);
  const headBoxes = (t: RunningHeadText): Partial<Record<Box, string>> => ({
    "top-left": t.left ? cssString(t.left) : undefined,
    "top-center": t.center ? cssString(t.center) : undefined,
    "top-right": t.right ? cssString(t.right) : undefined,
  });
  const pageRule = (name: string, head: Partial<Record<Box, string>>, foot: Partial<Record<Box, string>>, bg: string) =>
    `@page${name ? ` ${name}` : ""}{background:${bg};` + BOXES.map((b) => boxDecl(b, head[b] ?? foot[b], styles)).join("") + `}`;

  const interiorBg = colour(tpl, "color.interior.paper", "FCFCFB");
  const wrapperBg = colour(tpl, "color.wrapper.paper", "FBFAF7");
  const docModes = templateModes(tpl, false);
  const registerOn = p[P.registerEnabled] !== false;
  const out: string[] = [
    `:root{--st-sheets:${cssString(String(sheets))};--class-ink:${classInk}}`,
    // Halaman bawaan (isi di luar unit): mode seksi interior templat.
    pageRule("", docModes.header === "runningHead" ? headBoxes(docRh) : {}, registerOn && docModes.footer === "registerBlock" ? reg : {}, interiorBg),
    `@page st-sheet{background:${interiorBg};${BOXES.map((b) => `@${b}{content:none}`).join("")}}`,
  ];
  for (const u of units) {
    const name = `st-u-${u.index}`;
    const head = u.header === "runningHead" ? headBoxes({ ...docRh, center: u.center }) : {};
    const foot = u.footer === "registerBlock" ? reg : {};
    out.push(pageRule(name, head, foot, u.wrapper ? wrapperBg : interiorBg));
    if (u.key !== undefined) out.push(`.st-unit[data-unit-key=${cssString(u.key)}]{page:${name}}`);
  }
  return out.join("\n");
}

/** Sisipkan salinan perabot layar (`.st-screen`) setelah tag pembuka tiap unit. */
export function withScreenFurniture(tpl: ResolvedTemplate, meta: DocMeta, bodyHtml: string, units: readonly ShellUnit[]): string {
  if (units.length === 0) return bodyHtml;
  const docRh = runningHeadText(tpl, meta);
  const reg = registerHtml(tpl, meta, "st-screen");
  const pieces: string[] = [];
  let at = 0;
  for (const u of units) {
    pieces.push(bodyHtml.slice(at, u.openEnd));
    if (u.header === "runningHead") pieces.push(runningHeadHtml({ ...docRh, center: u.center }, "st-screen"));
    if (u.footer === "registerBlock") pieces.push(reg);
    at = u.openEnd;
  }
  pieces.push(bodyHtml.slice(at));
  return pieces.join("");
}

/** Tolak CSS fon yang bukan `@font-face` data: (KT-11: tanpa rujukan eksternal, tanpa keluar dari `<style>`). */
export function assertFontsCss(css: string): void {
  const issues: string[] = [];
  if (/<\/?style\b|<script\b|<!--/i.test(css)) issues.push("tag HTML di dalam CSS fon");
  if (/@import\b/i.test(css)) issues.push("@import");
  if (/expression\s*\(|javascript:/i.test(css)) issues.push("ekspresi/javascript");
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")\s]{0,40})/gi)) {
    if (!/^data:(font\/ttf|application\/font-sfnt)[;,]/i.test(m[2])) issues.push(`url bukan data: fon (${m[2].slice(0, 30)})`);
  }
  if (issues.length > 0) {
    throw new StudioEngineError("BY_CONSTRUCTION_FAILED", "fontsCss tidak mandiri", { issues: [...new Set(issues)].sort() });
  }
}

/**
 * K2 rev B (FIX-R1, padanan DOCX `assertRailK2`): pada moda A dengan perender `framePr`
 * prosa tanpa rel selebar teks penuh; hanya inang (`.st-railhost`, grid kolom teks + rel)
 * yang menyempit. Menimpa batas `max-width:var(--col)` moda A lama. Tidak dipancarkan
 * untuk `table3col` (Manual 000) maupun moda B.
 */
const RAIL_K2_CSS =
  "body.st-rail-k2.st-rail-a :is(.st-p,.st-list,.st-aside,.st-monoblock,.st-asm,.st-section-heading):not(.st-railhost *){max-width:none}";

export interface HtmlShellInput {
  tpl: ResolvedTemplate;
  meta: DocMeta;
  bodyHtml: string;
  fontsCss: string;
  previewLabel?: boolean;
}

/** Dokumen HTML lengkap; deterministik untuk masukan yang sama. */
export function buildHtmlShell(i: HtmlShellInput): string {
  const { tpl, meta } = i;
  assertFontsCss(i.fontsCss);
  const units = scanUnits(tpl, i.bodyHtml);
  const sheets = countSheets(i.bodyHtml);
  // P4S-07 rel dimatikan -> moda B (tanpa kolom rel); selain itu KT-07 via S11.
  const rail = tpl.params[P.railEnabled] === false ? "B" : railModeFor(tpl, countRailCitations(i.bodyHtml));
  const body = withScreenFurniture(tpl, meta, i.bodyHtml, units);
  const en = meta.language === "EN";
  const label = i.previewLabel
    ? `<div class="st-preview-label" role="note">${esc(en ? "Preview · not an issued document" : "Pratinjau · bukan dokumen terbit")}</div>`
    : "";
  const title = `${i.previewLabel ? (en ? "[PREVIEW] " : "[PRATINJAU] ") : ""}${meta.title}`;
  const docNo = meta.docNumber?.trim();
  const metaTags = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="generator" content="GSP Studio engine/html/base">`,
    docNo ? `<meta name="studio:doc-number" content="${esc(docNo)}">` : "",
    `<meta name="studio:revision" content="${esc(meta.rev)}">`,
    `<meta name="studio:classification" content="${esc(meta.classification)}">`,
    `<meta name="studio:issue-date" content="${esc(meta.issueDate)}">`,
  ].join("");
  const k2 = rail === "A" && railK2ReserveOf((k) => tpl.params[k]) !== undefined;
  const flags = ["st-doc", `st-rail-${rail === "B" ? "b" : "a"}`, k2 ? "st-rail-k2" : "", i.previewLabel ? "st-preview" : ""].filter(Boolean);
  return (
    `<!DOCTYPE html>\n` +
    `<html lang="${en ? "en" : "id"}"><head>${metaTags}<title>${esc(title)}</title>\n` +
    `<style data-studio="fonts">\n${i.fontsCss}\n</style>\n` +
    `<style data-studio="tokens">\n${buildTokenCss(tpl)}</style>\n` +
    `<style data-studio="pages">\n${pageFurnitureCss(tpl, meta, units, sheets)}${k2 ? `\n${RAIL_K2_CSS}` : ""}\n</style>\n` +
    `</head>\n<body class="${flags.join(" ")}" data-rail-mode="${rail}">${label}\n${body}\n</body></html>\n`
  );
}

/** Kotak margin `@page` yang disusun perabot halaman. */
export const SHELL_MARGIN_BOXES: readonly string[] = BOXES;
