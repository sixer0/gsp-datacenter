/**
 * S20: konteks pasangan templat x bahasa (research/32 §0.2) dari register nama S01
 * (research/31 §1). Ini data uji harness, bukan cabang slug di mesin (U4).
 */
import type { Lang, PairContext, Tier } from "../rules/types";

export interface PairDefaults {
  readonly language: Lang;
  readonly typeCode: string;
  readonly tier: Tier;
  readonly kicker: string;
}

export const PAIR_REGISTER: Readonly<Record<string, PairDefaults>> = {
  "datum-proposal-teknis": { language: "ID", typeCode: "PT", tier: "SERAH", kicker: "PROPOSAL TEKNIS" },
  "datum-proposal-teknis-en": { language: "EN", typeCode: "PT", tier: "SERAH", kicker: "TECHNICAL PROPOSAL" },
  "datum-laporan": { language: "ID", typeCode: "LAP", tier: "TERBIT", kicker: "LAPORAN" },
  "datum-laporan-en": { language: "EN", typeCode: "LAP", tier: "TERBIT", kicker: "REPORT" },
  "datum-laporan-verifikasi": { language: "ID", typeCode: "VER", tier: "TERBIT", kicker: "LAPORAN VERIFIKASI" },
  "datum-laporan-verifikasi-en": { language: "EN", typeCode: "VER", tier: "TERBIT", kicker: "VERIFICATION REPORT" },
  "datum-standar": { language: "ID", typeCode: "STD", tier: "TERBIT", kicker: "STANDAR" },
  "datum-standar-en": { language: "EN", typeCode: "STD", tier: "TERBIT", kicker: "STANDARD" },
  "datum-nota": { language: "ID", typeCode: "NOT", tier: "NOTA", kicker: "NOTA INTERNAL" },
  "datum-nota-en": { language: "EN", typeCode: "NOT", tier: "NOTA", kicker: "INTERNAL NOTE" },
  // Kalibrasi S25 (research/32 §0.2): structure.ts:94-99, page.ts:414.
  "datum-gsp": { language: "ID", typeCode: "KT", tier: "TERBIT", kicker: "" },
};

export interface PairOptions {
  readonly template: string;
  readonly language: Lang;
  readonly tier: Tier;
  readonly typeCode?: string;
  readonly kicker?: string;
  readonly producedBy?: "mcp" | "r08";
  readonly copyControl?: boolean;
  readonly agentRevisionText?: boolean;
}

export class PairError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PairError";
  }
}

export function resolvePair(o: PairOptions): { pair: PairContext; warnings: string[] } {
  const reg = PAIR_REGISTER[o.template];
  const warnings: string[] = [];
  if (!reg && o.typeCode === undefined) {
    throw new PairError(`templat ${o.template} tidak ada di register (research/31 §1); berikan --type-code (dan --kicker bila ada)`);
  }
  if (!reg) warnings.push(`templat ${o.template} di luar register; kode jenis dan kicker dari argumen`);
  if (reg && reg.language !== o.language) warnings.push(`bahasa ${o.language} berbeda dari bahasa register ${reg.language}`);
  if (reg && reg.tier !== o.tier) warnings.push(`tier ${o.tier} menimpa tier bawaan register ${reg.tier}`);
  if (reg && o.typeCode !== undefined && o.typeCode !== reg.typeCode) warnings.push(`kode jenis ${o.typeCode} menimpa register ${reg.typeCode}`);
  if (reg && o.kicker !== undefined && o.kicker !== reg.kicker) warnings.push(`kicker "${o.kicker}" menimpa register "${reg.kicker}"`);
  return {
    pair: {
      slug: o.template,
      language: o.language,
      tier: o.tier,
      typeCode: o.typeCode ?? reg!.typeCode,
      kicker: o.kicker ?? reg?.kicker ?? "",
      producedBy: o.producedBy ?? "mcp",
      agentRevisionText: o.agentRevisionText ?? false,
      hasCopyControl: o.copyControl ?? false,
    },
    warnings,
  };
}
