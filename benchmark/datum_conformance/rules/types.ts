/**
 * S20: kontrak aturan harness konformitas DATUM Rev A (research/32 §0).
 *
 * Modul aturan S21-S23 mengekspor `rules: readonly Rule[]`, idealnya dibangun dengan
 * `defineRule(<kode katalog>, check)` agar metadata (keluarga, sitasi, keberlakuan, kritis)
 * selalu sama dengan `catalog.ts`. Indeks (`rules/index.ts`) menolak metadata yang menyimpang.
 */
import { CATALOG_BY_ID, type CatalogEntry } from "../catalog";
import type { DocxDocument } from "../lib/docx";
import type { DocLayout } from "../lib/layout";

export type Tier = "NOTA" | "TERBIT" | "SERAH";
export type Lang = "ID" | "EN";
export type RuleKind = "measurable" | "clash";
export type ModuleId = "structure_a" | "structure_b" | "language" | "clash";

/** Status hasil (research/32 §0.3). */
export type RuleStatus = "pass" | "fail" | "na" | "unexercised";

export interface Applicability {
  readonly tiers: readonly Tier[];
  readonly languages: readonly Lang[];
  /** `"all"` atau daftar kode jenis (PT, LAP, VER, STD, NOT, KT, ...). */
  readonly types: "all" | readonly string[];
}

/** Konteks pasangan templat x bahasa (research/32 §0.2), bukan dari isi DOCX. */
export interface PairContext {
  readonly slug: string;
  readonly language: Lang;
  /** Tier efektif = tier yang diharapkan pasangan. */
  readonly tier: Tier;
  readonly typeCode: string;
  /** Kicker sampul yang diharapkan (kosong untuk kalibrasi `datum-gsp`). */
  readonly kicker: string;
  readonly producedBy: "mcp" | "r08";
  readonly agentRevisionText: boolean;
  readonly hasCopyControl: boolean;
}

export interface RuleContext {
  readonly docx: DocxDocument;
  readonly pair: PairContext;
  /** Klasifikasi seksi R0 (SAMPUL, PEMBUNGKUS, LEMBAR KENDALI, DAFTAR ISI, INTERIOR). */
  readonly layout: DocLayout;
  /** DOCX fiksur bind B-FIX pasangan ini (research/32 §10), bukti CR-3. */
  readonly bfix?: DocxDocument;
  readonly bfixLayout?: DocLayout;
  /** Tabel spec templat (JSON bebas), bukti NU-03. */
  readonly spec?: unknown;
}

export interface RuleResult {
  readonly status: RuleStatus;
  /** Ringkasan bukti yang dapat dibaca manusia (wajib, juga untuk pass). */
  readonly evidence: string;
  /** Bagian OOXML, mis. `word/footer5.xml`. */
  readonly part?: string;
  /** Lokasi di bagian itu, mis. `seksi 3, tabel register sel 4`. */
  readonly location?: string;
  /** Nilai teramati. */
  readonly observed?: string;
}

export interface Rule extends CatalogEntry {
  check(ctx: RuleContext): RuleResult;
}

type Extra = Omit<RuleResult, "status" | "evidence">;

export const pass = (evidence: string, extra: Extra = {}): RuleResult => ({ status: "pass", evidence, ...extra });
export const fail = (evidence: string, extra: Extra = {}): RuleResult => ({ status: "fail", evidence, ...extra });
export const na = (evidence: string, extra: Extra = {}): RuleResult => ({ status: "na", evidence, ...extra });
export const unexercised = (evidence: string, extra: Extra = {}): RuleResult => ({ status: "unexercised", evidence, ...extra });

/** Membangun aturan dari entri katalog; kode di luar katalog = galat. */
export function defineRule(id: string, check: (ctx: RuleContext) => RuleResult): Rule {
  const entry = CATALOG_BY_ID.get(id);
  if (!entry) throw new Error(`defineRule: kode ${id} tidak ada di katalog (research/32)`);
  return { ...entry, check };
}
