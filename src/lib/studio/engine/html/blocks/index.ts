/**
 * engine/html/blocks (I11, 01_specs.md §8.2), diisi S22: padanan HTML
 * semantik himpunan blok teks S16 + pembungkus S18. Tanpa skrip; semua
 * masukan di-escape; aset hanya `data:` URI; `data-address` pada setiap blok
 * beralamat (konvensi S25 measure.ts, D-38).
 *
 * Asumsi `NormBlock.content` (kontrak menulis `unknown`): blok isi = objek
 * blok apa adanya; chapter/appendix = `Chapter` (hanya kepala; seksi dan blok
 * adalah NormBlock terpisah); section = `Section` (hanya judul); cover dan
 * controlSheet = `FrontPage` (termasuk `body[]` mode explicit); toc =
 * `TocSpec`; partDivider = `PartSpec`; signatureBlock = `SignatureBlock`.
 */
import type { BlockType, HtmlBlockRenderer, StructuralType } from "../../../contract";
import {
  renderAppendix,
  renderAside,
  renderAssumptionInline,
  renderChapter,
  renderDeviceBlock,
  renderList,
  renderMonoBlock,
  renderParagraph,
  renderSection,
  renderSpacer,
} from "./text";
import { renderControlSheet, renderCover, renderPartDivider, renderSignatureBlock, renderToc } from "./wrapper";
import { withAutoSpacers } from "./semantic";

export { escapeHtml } from "./escape";
export { HTML_BLOCK_CLASSES, HTML_BLOCKS_CSS } from "./classes";
export { parseMdLiteHtml } from "./inline";
export { PARAM_SPACER_AUTO_MODE, autoSpacerRole, semanticRuns, semanticTransform, symbolBoundRuns, withAutoSpacer } from "./semantic";

/** Renderer dibungkus spacer otomatis peran (RT-01/RQ-5; opt-in `render.spacer.autoMode`). */
export const htmlBlocks: Partial<Record<BlockType | StructuralType, HtmlBlockRenderer>> = withAutoSpacers<BlockType | StructuralType>({
  // S16: blok teks
  chapter: renderChapter,
  section: renderSection,
  paragraph: renderParagraph,
  list: renderList,
  aside: renderAside,
  monoBlock: renderMonoBlock,
  assumptionInline: renderAssumptionInline,
  spacer: renderSpacer,
  device: renderDeviceBlock,
  // S18: pembungkus
  cover: renderCover,
  controlSheet: renderControlSheet,
  toc: renderToc,
  partDivider: renderPartDivider,
  signatureBlock: renderSignatureBlock,
  appendix: renderAppendix,
});
