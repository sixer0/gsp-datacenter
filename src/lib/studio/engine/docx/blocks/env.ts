/**
 * Lingkungan render satu blok (S16): akses parameter resolved, resolusi format
 * peran, peta wajah, kolom rel, media, log.
 *
 * Urutan prioritas format (01_specs.md §5.6): format eksplisit blok >
 * `roleFormats[role]` versi templat > turunan katalog (S11 `resolveRoleFormat`)
 * > gaya Normal templat (styles.xml S14, tidak disalin). Bawaan struktural
 * modul ini (mis. `keepNext`/`outlineLvl` judul, indentasi gantung daftar)
 * berada DI BAWAH turunan katalog dan hanya dipakai bila templat tidak menulis
 * sub-objek `para` peran itu, agar profil terukur (Manual 000, S95) tidak
 * mendapat atribut yang tidak ada di sumbernya (pola S11 D-37).
 */
import type {
  Hex,
  NormBlock,
  NormUnitKind,
  ParaFormat,
  ParamValue,
  RenderContext,
  RoleFormat,
  RoleKey,
  RunProps,
} from "../../../contract";
import { StudioEngineError } from "../../../contract/errors";
import { PARAMS_BY_KEY } from "../../../params";
import { mmToTw, resolveRoleFormat, resolveTokenColor } from "../../tokens";
import { FACE_ROLES, mergePara, mergeRun, rPrXml, pPrInner, type FaceMap } from "./props";
import { inlineRuns, runsXmlWith, runXmlWith } from "./runs";
import { applySemanticRuns } from "./semantic";
import type { Inline, Run } from "../../../contract";
import { paragraph } from "./xml";

export interface MediaItem {
  name: string;
  data: Uint8Array;
  contentType: string;
}

/** Tata kolom rel: moda A = [teks, gutter, rel] twip; moda B = [bentang penuh]. */
export interface RailLayout {
  mode: "A" | "B";
  renderer: "framePr" | "table3col";
  colsTw: number[];
}

const MODULE = "engine/docx/blocks";

function defaultFace(role: string): string | undefined {
  const d = PARAMS_BY_KEY.get(`type.face.${role}`)?.default;
  return typeof d === "string" ? d : undefined;
}

/** Peta wajah dari parameter `type.face.*` (cadangan: default registri). */
export function faceMapFrom(params: Readonly<Record<string, ParamValue>> | undefined): FaceMap {
  const out = {} as Record<string, string>;
  for (const role of FACE_ROLES) {
    const v = params?.[`type.face.${role}`];
    out[role] = typeof v === "string" && v.trim() ? v.trim() : (defaultFace(role) ?? role);
  }
  return out as FaceMap;
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export class BlockEnv {
  readonly faces: FaceMap;
  readonly used = new Set<string>();
  readonly media: MediaItem[] = [];
  private drawingSeq = 0;

  constructor(
    readonly block: NormBlock,
    readonly ctx: RenderContext,
  ) {
    this.faces = faceMapFrom(ctx.tpl.params);
  }

  param(key: string): ParamValue | undefined {
    return this.ctx.tpl.params[key];
  }

  num(key: string): number | undefined {
    const v = this.param(key);
    return isNum(v) ? v : undefined;
  }

  /**
   * Parameter angka turunan yang wajib ada (D-245 H1): absen = BY_CONSTRUCTION_FAILED
   * (dicatat ke log job), tanpa cadangan literal A4.
   */
  requiredNum(key: string): number {
    const v = this.num(key);
    if (v !== undefined) return v;
    const where = this.block.address ?? this.block.blockId;
    const msg = `${MODULE}: blok ${this.block.type} ${where}: parameter turunan ${key} tidak terbaca (wajib ada di parameter templat)`;
    this.ctx.log({ level: "error", message: msg, code: "BY_CONSTRUCTION_FAILED", address: this.block.address ?? undefined });
    throw new StudioEngineError("BY_CONSTRUCTION_FAILED", msg, { blockId: this.block.blockId, address: this.block.address, key });
  }

  color(ref: string | undefined): Hex | undefined {
    return ref ? resolveTokenColor(this.ctx.tpl, ref) : undefined;
  }

  /** Jenis unit pemilik blok (cover, part, chapter, ...). */
  unitKind(): NormUnitKind | undefined {
    return this.ctx.snapshot.units.find((u) => u.key === this.block.unitKey)?.kind;
  }

  /** Format peran resolved; `structural` = bawaan modul di bawah turunan katalog. */
  role(key: RoleKey, structural?: ParaFormat): RoleFormat {
    const rf = resolveRoleFormat(this.ctx.tpl, key);
    if (!structural || this.ctx.tpl.roleFormats[key]?.para) return rf;
    return { ...rf, para: mergePara(structural, rf.para) };
  }

  /** Apakah templat menulis sub-objek peran ini secara eksplisit. */
  templateHas(key: RoleKey, part: keyof RoleFormat): boolean {
    return this.ctx.tpl.roleFormats[key]?.[part] !== undefined;
  }

  // ── tulis ─────────────────────────────────────────────────────────────

  /**
   * Run semantik dokumen konten-saja (RT-01, D-119; aturan di `./semantic`):
   * `render.run.strong`, `glyphRun` peran yang ditulis templat, dan
   * `render.run.symbolGlyphByRole[role]`. Tanpa `role` hanya `strong`.
   */
  semanticRuns(runs: readonly Run[], base: RunProps, role?: RoleKey): Run[] {
    const glyph = role ? this.ctx.tpl.roleFormats[role]?.glyphRun : undefined;
    return applySemanticRuns(runs, base, this.ctx.tpl.params, role, glyph);
  }

  runs(runs: readonly Run[], base: RunProps, role?: RoleKey): string {
    return runsXmlWith(this.semanticRuns(runs, base, role), base, this.faces, this.used);
  }

  run(run: Run, base: RunProps, tail = ""): string {
    return runXmlWith(run, base, this.faces, this.used, tail);
  }

  /** `role` = peran inang run (glif/simbol templat); opsional. */
  inline(inline: Inline, base: RunProps, md: boolean, role?: RoleKey): string {
    try {
      return this.runs(inlineRuns(inline, base, md), base, role);
    } catch (e) {
      throw this.fail(e instanceof Error ? e.message : String(e));
    }
  }

  para(format: ParaFormat, content: string, framePr?: string): string {
    return paragraph(pPrInner(format, framePr), content);
  }

  rPr(p: RunProps): string {
    return rPrXml(p, this.faces, this.used);
  }

  mergeRun(a: RunProps | undefined, b: RunProps | undefined): RunProps {
    return mergeRun(a, b);
  }

  // ── grid dan rel ──────────────────────────────────────────────────────

  mmToTw(mm: number): number {
    return mmToTw(mm);
  }

  /** Lebar bentang penuh (twip). */
  fullSpanTw(): number {
    const cols = this.rail().colsTw;
    const sum = cols.reduce((a, b) => a + b, 0);
    const full = this.num("grid.fullSpanMm");
    return full !== undefined ? mmToTw(full) : sum;
  }

  /** Lebar kolom teks (twip): kolom pertama tata rel. */
  textColumnTw(): number {
    return this.rail().colsTw[0];
  }

  rail(): RailLayout {
    const rendererParam = this.param("render.rail.renderer");
    const renderer = rendererParam === "table3col" ? "table3col" : "framePr";
    const raw = this.param("render.rail.colsTw");
    let colsTw = Array.isArray(raw) && raw.every(isNum) && raw.length > 0 ? (raw as number[]).map(Math.round) : undefined;
    if (!colsTw) {
      const text = this.requiredNum("grid.textColumnMm");
      const gutter = this.num("grid.gutterMm") ?? 6;
      const rail = this.num("grid.evidenceRailMm") ?? 32;
      colsTw = this.param("layout.railMode") === "B" ? [mmToTw(text + gutter + rail)] : [mmToTw(text), mmToTw(gutter), mmToTw(rail)];
    }
    // `auto` tanpa konteks sitasi = susunan moda A (D-37); B bila diminta atau kolom rel tunggal.
    const mode = this.param("layout.railMode") === "B" || colsTw.length < 3 ? "B" : "A";
    return { mode, renderer, colsTw };
  }

  /**
   * Tebal garis mm -> `w:sz` (1/8 pt) dikuantisasi ke tangga `rules.wordLadderSz`
   * (P4R-11; 0,45 -> 10, 0,35 -> 8, 0,25 -> 6, 0,20 -> 5).
   */
  ruleSz(mm: number): number {
    const eighths = (mm / 25.4) * 72 * 8;
    const ladder = this.param("rules.wordLadderSz");
    const steps = Array.isArray(ladder) && ladder.every(isNum) && ladder.length > 0 ? (ladder as number[]) : [5, 6, 8, 10, 11];
    let best = steps[0];
    for (const s of steps) {
      if (Math.abs(s - eighths) < Math.abs(best - eighths) || (Math.abs(s - eighths) === Math.abs(best - eighths) && s > best)) best = s;
    }
    return best;
  }

  /** Garis tunggal dari parameter tebal (mm) dan warna (tokenRef). */
  rule(weightKey: string, colourKey: string | undefined, fallbackMm: number, fallbackColour: string): { val: "single"; sz: number; color: Hex; space: number } {
    const mm = this.num(weightKey) ?? fallbackMm;
    const colourRef = colourKey ? this.param(colourKey) : undefined;
    const color = this.color(typeof colourRef === "string" ? colourRef : fallbackColour) ?? this.color(fallbackColour) ?? "auto";
    return { val: "single", sz: this.ruleSz(mm), color, space: 0 };
  }

  // ── media ─────────────────────────────────────────────────────────────

  addMedia(item: MediaItem): void {
    if (!this.media.some((m) => m.name === item.name)) this.media.push(item);
  }

  /** Id `wp:docPr` deterministik per blok (ordinal x 100 + urutan gambar). */
  nextDrawingId(): number {
    this.drawingSeq += 1;
    return this.block.ordinal * 100 + this.drawingSeq;
  }

  // ── galat dan log (sink persisten = ctx.log milik layanan render) ─────

  warn(message: string, code?: string): void {
    this.ctx.log({ level: "warn", message: `${MODULE}: ${message}`, code, address: this.block.address ?? undefined });
  }

  /** Catat galat lalu kembalikan `StudioEngineError` SCHEMA_INVALID untuk dilempar. */
  fail(message: string): StudioEngineError {
    const where = this.block.address ?? this.block.blockId;
    const msg = `${MODULE}: blok ${this.block.type} ${where}: ${message}`;
    this.ctx.log({ level: "error", message: msg, code: "SCHEMA_INVALID", address: this.block.address ?? undefined });
    return new StudioEngineError("SCHEMA_INVALID", msg, { blockId: this.block.blockId, address: this.block.address });
  }
}
