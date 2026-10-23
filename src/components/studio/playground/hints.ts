/*
 * Petunjuk nilai contoh minimal v2 (SR-31; pola S100). Pembangkit
 * (`example.ts`) menelusuri JSON Schema registri dan memakai nilai ini per
 * nama medan bila lolos `pattern`/`enum` skema; selain itu nilai aman bawaan.
 * Nilai templat/misi/kunci dokumen berasal dari isian panel (registri R01).
 */

import type { ExampleHints } from "./example";
import type { JsonMode } from "./types";

export interface HintContext {
  templateSlug: string;
  missionFolder: string;
  docKey: string;
}

export function buildHints(mode: JsonMode, ctx: HintContext): ExampleHints {
  const strings: Record<string, string> = {
    slug: ctx.templateSlug,
    folder: ctx.missionFolder,
    docKey: ctx.docKey,
    title: "Contoh dari alat developer",
    text: "Paragraf contoh dari alat developer.",
    t: "Teks contoh.",
    // Kunci bab numerik (C33a) dan slot Lembar kendali (SLOT_KEY_PATTERN).
    key: "1",
    slot: "controlSheet",
    agentId: "alat-developer",
  };
  const enums: Record<string, unknown> = { language: "ID", tier: "NOTA" };
  // Slot tak-berulang: payload Lembar kendali agar `type` cocok dengan `slot`.
  const discriminators: Record<string, string> = { type: mode === "slot" ? "controlSheet" : "paragraph" };
  return { strings, numbers: {}, enums, discriminators };
}
