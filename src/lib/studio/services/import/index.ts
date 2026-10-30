/**
 * Importer Markdown resmi `md/v1` -> `studio.chapter/v2` konten-saja (FIX-H7, D-321/D-322).
 * Hanya mengubah: tidak menyimpan, tidak merender. Dipakai route
 * `POST /api/studio/import/markdown` dan CLI `scripts/studio/md2chapter.ts`.
 */
export {
  importMarkdownChapter,
  MD_IMPORT_MAX_BLOCKS,
  MD_IMPORT_MAX_BODY_BYTES,
  MD_IMPORT_MAX_CHARS,
  MD_IMPORT_MAX_LINES,
  MD_IMPORT_MAX_TABLE_COLUMNS,
  MD_REPORT_MAX_ENTRIES,
} from "./markdown";
export { MD_IMPORTER_VERSION } from "./types";
export type {
  MarkdownImportOptions,
  MarkdownImportResult,
  MarkdownImportValidation,
  MdConstruct,
  MdDropKind,
  MdEnvelopeOptions,
  MdImportDropped,
  MdImportMapping,
  MdImportReport,
  MdImportWarning,
} from "./types";
