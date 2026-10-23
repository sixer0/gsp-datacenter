/**
 * Perakit status mesin render untuk R11 `/api/studio/render-env` (S102).
 *
 * HANYA BACA: kesiapan dari S92 (`checkRenderEnvReadiness`, cache C15),
 * antrean soffice (`sofficeQueueState`), manifest S91 (dibaca untuk nama
 * berkas fon + status wajib), dan baris `StudioRenderJob` (S51). Modul ini
 * tidak pernah menulis HKCU, fon, manifest, maupun baris job.
 *
 * Keluaran ke klien tanpa stack trace: `engine.log` dipangkas ke entri
 * terakhir tanpa `stack_trace`, pesan galat dipotong dan dibersihkan dari baris
 * bingkai stack; path profil user diganti `%USERPROFILE%`.
 *
 * Folder `_lib` privat App Router (tidak dirutekan).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma, StudioRenderJob } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStudioEnv } from "@/lib/studio/contract/env";
import { STUDIO_RENDER_JOB_STATUSES, type StudioRenderJobStatus } from "@/lib/studio/contract/enums";
import type { RenderEnvManifest, RenderEnvReadiness } from "@/lib/studio/contract/render-env";
import type { RenderEnvResponse, RenderJobDto } from "@/lib/studio/contract/types/api";
import { checkRenderEnvReadiness, resetReadinessCache, sofficeQueueState } from "@/lib/studio/engine/soffice";
import { renderJobToDto } from "@/lib/studio/services/render";
import { isRecord, redactPaths, stripStack } from "@/lib/studio/http";

// ── Batas kueri ──────────────────────────────────────────────────────────

export const JOBS_TAKE_DEFAULT = 50;
export const JOBS_TAKE_MAX = 200;
export const LOG_TAIL_DEFAULT = 20;
export const LOG_TAIL_MAX = 100;
const MESSAGE_MAX_CHARS = 600;
const ERROR_SUMMARY_MAX_CHARS = 1000;

// ── Bentuk respons (memperluas kontrak RenderEnvResponse secara aditif) ──

export interface RenderEnvFontStatus {
  family: string;
  style: string;
  /** Nama berkas saja (tanpa direktori). */
  file: string | null;
  required: boolean;
  fileExists: boolean;
  sha256Ok: boolean;
  registered: boolean;
  ok: boolean;
}

export interface RenderJobLogLine {
  timestamp: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  code?: string;
  address?: string;
}

export interface RenderJobStatusDto extends RenderJobDto {
  /** Pesan galat ringkas (tanpa baris stack, maks 1000 karakter). */
  errorSummary: string | null;
  /** Ekor `engine.log` (maks `log` entri, tanpa stack trace). */
  logTail: RenderJobLogLine[];
  /** Jumlah entri log tersimpan seluruhnya. */
  logTotal: number;
  /** Entri yang dibuang S51 karena batas 300. */
  logDropped: number;
}

export interface RenderEnvStatusResponse extends RenderEnvResponse {
  jobs?: RenderJobStatusDto[];
  fonts: RenderEnvFontStatus[];
  queue: { active: number; queued: number; max: number };
  manifest: { path: string; readable: boolean; createdAt: string | null; sofficeVersion: string | null; chromiumVersion: string | null };
  viewer: { canRefresh: boolean };
  refreshed: boolean;
  jobCounts?: Record<StudioRenderJobStatus, number>;
  /** Terisi bila daftar job gagal dimuat (kesiapan tetap dikirim). */
  jobsError?: string;
}

export interface JobsQuery {
  take: number;
  statuses: StudioRenderJobStatus[];
  logTail: number;
}

// ── Pembersih keluaran ───────────────────────────────────────────────────
// `redactPaths`/`stripStack` dipindah ke helper bersama (IP-08); diekspor ulang
// agar pemakai lama modul ini tetap bekerja.

export { redactPaths, stripStack };

function toLogLine(raw: unknown): RenderJobLogLine | null {
  if (!isRecord(raw)) return null;
  const level = raw.level === "warn" || raw.level === "error" ? raw.level : "info";
  const line: RenderJobLogLine = {
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : "",
    level,
    source: typeof raw.source === "string" ? raw.source.slice(0, 80) : "-",
    message: stripStack(typeof raw.message === "string" ? raw.message : String(raw.message ?? ""), MESSAGE_MAX_CHARS),
  };
  if (typeof raw.code === "string" && raw.code) line.code = raw.code.slice(0, 80);
  if (typeof raw.address === "string" && raw.address) line.address = raw.address.slice(0, 80);
  return line;
}

// ── Manifest (baca saja) ─────────────────────────────────────────────────

interface ManifestView {
  readable: boolean;
  manifest: RenderEnvManifest | null;
}

async function readManifest(manifestPath: string): Promise<ManifestView> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, "")) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.fonts)) return { readable: true, manifest: null };
    return { readable: true, manifest: parsed as unknown as RenderEnvManifest };
  } catch {
    // S92 sudah mencatat manifest tak terbaca di readiness.errors; di sini cukup ditandai.
    return { readable: false, manifest: null };
  }
}

function baseName(file: string): string {
  return path.win32.basename(path.posix.basename(file));
}

function fontStatuses(readiness: RenderEnvReadiness, manifest: RenderEnvManifest | null): RenderEnvFontStatus[] {
  const byKey = new Map<string, { file: string; required: boolean }>();
  for (const f of manifest?.fonts ?? []) {
    if (f && typeof f.family === "string" && typeof f.style === "string") {
      byKey.set(`${f.family}\u0000${f.style}`, { file: typeof f.file === "string" ? baseName(f.file) : "", required: f.required !== false });
    }
  }
  return readiness.fonts.map((f) => {
    const m = byKey.get(`${f.family}\u0000${f.style}`);
    return {
      family: f.family,
      style: f.style,
      file: m?.file || null,
      required: m?.required ?? true,
      fileExists: f.fileExists,
      sha256Ok: f.sha256Ok,
      registered: f.registered,
      ok: f.fileExists && f.sha256Ok && f.registered,
    };
  });
}

// ── Job ──────────────────────────────────────────────────────────────────

function toStatusDto(row: StudioRenderJob, logTail: number): RenderJobStatusDto {
  const dto = renderJobToDto(row);
  const eng = isRecord(row.engine) ? row.engine : null;
  const rawLog = eng && Array.isArray(eng.log) ? (eng.log as unknown[]) : [];
  const lines = logTail > 0 ? rawLog.slice(-logTail).map(toLogLine).filter((l): l is RenderJobLogLine => l !== null) : [];
  const dropped = eng && typeof eng.logDropped === "number" ? eng.logDropped : 0;
  const errors = dto.errors?.map((e) => ({ ...e, message: e.message ? stripStack(e.message, MESSAGE_MAX_CHARS) : e.message }));
  return {
    ...dto,
    ...(errors ? { errors } : {}),
    errorMessage: dto.errorMessage ? stripStack(dto.errorMessage, ERROR_SUMMARY_MAX_CHARS) : null,
    errorSummary: dto.errorMessage ? stripStack(dto.errorMessage.split(/\r?\n/)[0] ?? "", 240) : null,
    logTail: lines,
    logTotal: rawLog.length,
    logDropped: dropped,
  };
}

async function loadJobs(q: JobsQuery): Promise<{ jobs: RenderJobStatusDto[]; counts: Record<StudioRenderJobStatus, number> }> {
  const where: Prisma.StudioRenderJobWhereInput =
    q.statuses.length > 0 && q.statuses.length < STUDIO_RENDER_JOB_STATUSES.length ? { status: { in: q.statuses } } : {};
  const [rows, grouped] = await Promise.all([
    prisma.studioRenderJob.findMany({ where, orderBy: { queuedAt: "desc" }, take: q.take }),
    prisma.studioRenderJob.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(STUDIO_RENDER_JOB_STATUSES.map((s) => [s, 0])) as Record<StudioRenderJobStatus, number>;
  for (const g of grouped) counts[g.status as StudioRenderJobStatus] = g._count._all;
  return { jobs: rows.map((r) => toStatusDto(r, q.logTail)), counts };
}

// ── Perakit utama ────────────────────────────────────────────────────────

export interface BuildStatusInput {
  refresh: boolean;
  canRefresh: boolean;
  jobs: JobsQuery | null;
  /** Dipanggil bila daftar job gagal; route mencatat ke sink tahan lama. */
  onJobsError: (err: unknown) => void;
}

export async function buildRenderEnvStatus(i: BuildStatusInput): Promise<RenderEnvStatusResponse> {
  if (i.refresh) resetReadinessCache();
  const env = getStudioEnv();
  const [readinessRaw, mv] = await Promise.all([checkRenderEnvReadiness(i.refresh ? { force: true } : undefined), readManifest(env.renderEnvManifestPath)]);
  const readiness: RenderEnvReadiness = { ...readinessRaw, errors: readinessRaw.errors.map(redactPaths) };

  const out: RenderEnvStatusResponse = {
    readiness,
    fonts: fontStatuses(readiness, mv.manifest),
    queue: sofficeQueueState(),
    manifest: {
      path: redactPaths(path.relative(process.cwd(), env.renderEnvManifestPath) || env.renderEnvManifestPath),
      readable: mv.readable,
      createdAt: typeof mv.manifest?.createdAt === "string" ? mv.manifest.createdAt : null,
      sofficeVersion: typeof mv.manifest?.soffice?.version === "string" ? mv.manifest.soffice.version : null,
      chromiumVersion: typeof mv.manifest?.chromium?.version === "string" ? mv.manifest.chromium.version : null,
    },
    viewer: { canRefresh: i.canRefresh },
    refreshed: i.refresh,
  };

  if (i.jobs) {
    try {
      const { jobs, counts } = await loadJobs(i.jobs);
      out.jobs = jobs;
      out.jobCounts = counts;
    } catch (err) {
      i.onJobsError(err);
      out.jobs = [];
      out.jobsError = "Daftar job render tidak dapat dimuat dari basis data.";
    }
  }
  return out;
}
