/**
 * Rel bukti per paragraf (S16; KT-18..KT-22, KT-29, KT-39; Garis A `rail_host`/`rail_chip`).
 *
 * Moda A, dua perender (R-12 `render.rail.renderer`):
 * - `framePr` (Garis A, datum_docx.py:584-619): paragraf inang menyempit ke
 *   kolom teks lewat `w:ind right` = gutter + rel; setiap baris rel menjadi
 *   chip paragraf ber-`w:framePr` (bentuk pasca round-trip Word
 *   RAIL_FRAMEPR_POST: w, wrap none, hAnchor margin, x) sesudah inang.
 * - `table3col` (BM.docx T013 dkk.): tabel 1x3 [prosa, penyela `<w:p/>`, rel],
 *   lebar dari R-13 `render.rail.colsTw`.
 * Moda B (tanpa kolom rel): baris rel ditulis sebagai paragraf biasa di
 *   bawah inang (format peran rel), tanpa bingkai.
 *
 * Baris tanda: run glif (`glyphRun[mark]` peran `rail.mark`, cadangan wajah
 * symbolGlyph + warna `marks.<m>.colour`) lalu run label " <label>" (pola
 * BM.docx: spasi pemisah di awal run label). Teks label/sumber/catatan apa adanya.
 */
import { PROVENANCE_GLYPHS, type ParaFormat, type ProvenanceMark, type RailLine, type RunProps } from "../../../contract";
import type { BlockEnv } from "./env";
import { singleRowTable } from "./table";
import { el } from "./xml";

export type HostVariant = "plain" | "framePr" | "table";

function markGlyph(env: BlockEnv, mark: ProvenanceMark): string {
  const v = env.param(`marks.${mark.toLowerCase()}.glyph`);
  return typeof v === "string" && v.length > 0 ? v : PROVENANCE_GLYPHS[mark];
}

function glyphRunProps(env: BlockEnv, mark: ProvenanceMark, labelRun: RunProps | undefined): RunProps {
  const explicit = env.role("rail.mark").glyphRun?.[mark];
  if (explicit) return explicit;
  const colourRef = env.param(`marks.${mark.toLowerCase()}.colour`);
  const color = env.color(typeof colourRef === "string" ? colourRef : undefined);
  return env.mergeRun(labelRun, { faceRole: "symbolGlyph", ...(color ? { color } : {}) });
}

/**
 * Run label baris tanda (S95-C04, RT-01): `labelRunByMark[tanda]` peran bila
 * ada; selain itu, bila templat MENULIS `glyphRun` peran `rail.mark`, label
 * berwarna sama dengan glifnya (BM: TERUKUR 101418, DITURUNKAN B45309, ASUMSI
 * 9B1C1C). Tanpa keduanya = run dasar peran (perilaku lama, profil kanonik).
 */
export function markLabelRun(env: BlockEnv, mark: ProvenanceMark, base: RunProps): RunProps {
  const byMark = env.role("rail.mark").labelRunByMark?.[mark];
  if (byMark) return env.mergeRun(base, byMark);
  const glyph = env.ctx.tpl.roleFormats["rail.mark"]?.glyphRun?.[mark];
  return glyph?.color ? env.mergeRun(base, { color: glyph.color }) : base;
}

/** Paragraf-paragraf baris rel; `framePr` diisi untuk chip moda A Garis A. */
export function railLinesXml(env: BlockEnv, lines: readonly RailLine[], framePr?: string): string {
  return lines
    .map((line, i) => {
      const roleKey = line.kind === "mark" ? "rail.mark" : line.kind === "source" ? "rail.source" : "rail.note";
      const rf = env.role(roleKey);
      const para: ParaFormat = { ...(rf.para ?? {}), ...(line.format ?? {}) };
      const base = rf.run ?? {};
      let content: string;
      if (line.runs) {
        content = env.runs(line.runs, base);
      } else if (line.kind === "mark") {
        if (!line.mark) throw env.fail(`rail[${i}] kind "mark" tanpa medan mark`);
        const glyph = env.run({ t: markGlyph(env, line.mark) }, glyphRunProps(env, line.mark, base));
        const label = markLabelRun(env, line.mark, base);
        content = glyph + env.run({ t: ` ${line.label ?? line.mark}` }, label);
      } else {
        const text = line.text ?? line.label;
        if (text === undefined) throw env.fail(`rail[${i}] kind "${line.kind}" tanpa text/label/runs`);
        content = env.run({ t: text }, base);
      }
      return env.para(para, content, framePr);
    })
    .join("");
}

/**
 * Bungkus inang dengan rel. `host(variant)` menulis paragraf inang sesuai varian:
 * `framePr` = inang menyempit (ind kanan), `table` = isi sel prosa 1x3, `plain` = biasa.
 */
export function withRail(env: BlockEnv, rail: readonly RailLine[] | undefined, host: (v: HostVariant) => string): string {
  if (!rail || rail.length === 0) return host("plain");
  const lay = env.rail();
  if (lay.mode === "B") return host("plain") + railLinesXml(env, rail);
  const [textTw, gutterTw, railTw] = lay.colsTw;
  if (lay.renderer === "framePr") {
    const framePr = el("w:framePr", { "w:w": railTw, "w:wrap": "none", "w:hAnchor": "margin", "w:x": textTw + gutterTw });
    return host("framePr") + railLinesXml(env, rail, framePr);
  }
  return singleRowTable(env, [
    { widthTw: textTw, content: host("table") },
    { widthTw: gutterTw, content: "<w:p/>" },
    { widthTw: railTw, content: railLinesXml(env, rail) },
  ]);
}

/** Indentasi kanan inang moda A framePr = gutter + rel (datum_docx.py RAIL_HOST_MM). */
export function railHostIndentTw(env: BlockEnv): number {
  const cols = env.rail().colsTw;
  return cols.length >= 3 ? cols[1] + cols[2] : 0;
}
