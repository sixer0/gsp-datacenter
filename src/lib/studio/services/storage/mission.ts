/**
 * Cek tautan misi (S52, I42 `assertMissionRefs`). KD-01: kolom string tanpa
 * FK, jadi keberadaan dicek di layanan:
 * - `agentRequestId` -> baris `AgentRequest`;
 * - `hermesTaskId` -> baris `HermesTask`;
 * - `folder` -> format §7.2, lalu keberadaan direktori `docs/<folder>` di
 *   `SHARED_WORKSPACE` (HANYA `stat`, tidak pernah menulis; KT-03) atau di
 *   akar Studio. Bila `SHARED_WORKSPACE` tidak disetel, keberadaan hanya dicek
 *   di akar Studio; folder belum ada di sana diterima dengan peringatan log
 *   (akar sandbox membuatnya saat tulis pertama).
 * Gagal -> `MISSION_REF_NOT_FOUND` (404) dengan `details.field`.
 */
import { stat } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import type { StudioDocV1 } from "../../contract";
import { StudioEngineError } from "../../contract/errors";
import { errorFields, storageLog } from "./log";
import { DOCS_DIR, missionDirName, storageRoot } from "./paths";

const MAX_REF_CHARS = 200;

let prismaCached: Promise<PrismaClient> | null = null;

/**
 * Prisma malas (D-155/D-186, IP-48): `@prisma/client` memuat `.env` ke
 * `process.env` saat diimpor, dan modul ini ikut termuat oleh jalur render
 * murni lewat barel `storage`. Klien dimuat pada panggilan DB pertama.
 */
function db(): Promise<PrismaClient> {
  prismaCached ??= import("@/lib/prisma").then((m) => m.prisma);
  return prismaCached;
}

function notFound(field: string, message: string): StudioEngineError {
  return new StudioEngineError("MISSION_REF_NOT_FOUND", message, { field });
}

async function isDirectory(abs: string): Promise<boolean> {
  try {
    return (await stat(abs)).isDirectory();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return false;
    throw err;
  }
}

function checkRefString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim() === "" || v.length > MAX_REF_CHARS) {
    throw notFound(field, `${field} is not a valid reference`);
  }
  return v;
}

async function assertFolderExists(folder: string): Promise<void> {
  // Format (melempar MISSION_REF_NOT_FOUND bila salah).
  missionDirName(folder, "");
  const studioCandidate = path.join(storageRoot(), DOCS_DIR, folder);
  const sharedRaw = process.env.SHARED_WORKSPACE?.trim();
  const candidates = sharedRaw ? [path.resolve(process.cwd(), sharedRaw, DOCS_DIR, folder), studioCandidate] : [studioCandidate];
  for (const c of candidates) {
    if (await isDirectory(c)) return;
  }
  if (!sharedRaw) {
    storageLog({
      level: "warn",
      message: "mission folder not verifiable (SHARED_WORKSPACE unset); accepted for sandbox root",
      code: "MISSION_FOLDER_UNVERIFIED",
      context: { folder },
    });
    return;
  }
  throw notFound("mission.folder", "mission.folder does not exist");
}

/** I42: tolak tautan misi yang tidak ada. `undefined` = tanpa tautan (lolos). */
export async function assertMissionRefs(m: StudioDocV1["mission"]): Promise<void> {
  if (m === undefined || m === null) return;
  try {
    if (m.folder !== undefined) await assertFolderExists(checkRefString(m.folder, "mission.folder"));
    if (m.agentRequestId !== undefined) {
      const id = checkRefString(m.agentRequestId, "mission.agentRequestId");
      const row = await (await db()).agentRequest.findUnique({ where: { id }, select: { id: true } });
      if (!row) throw notFound("mission.agentRequestId", "AgentRequest not found");
    }
    if (m.hermesTaskId !== undefined) {
      const id = checkRefString(m.hermesTaskId, "mission.hermesTaskId");
      const row = await (await db()).hermesTask.findUnique({ where: { id }, select: { id: true } });
      if (!row) throw notFound("mission.hermesTaskId", "HermesTask not found");
    }
  } catch (err) {
    if (err instanceof StudioEngineError) throw err;
    storageLog({ level: "error", message: "mission reference check failed", code: "MISSION_CHECK_FAILED", ...errorFields(err) });
    throw err;
  }
}
