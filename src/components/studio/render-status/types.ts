/*
 * Tipe respons R11 `/api/studio/render-env` untuk UI status mesin (S102).
 * Sumber tunggal: perakit route (impor tipe saja, tidak membawa kode server).
 */

export type {
  RenderEnvFontStatus,
  RenderEnvStatusResponse,
  RenderJobLogLine,
  RenderJobStatusDto,
} from "@/app/api/studio/render-env/_lib/status";
