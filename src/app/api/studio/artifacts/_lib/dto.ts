/**
 * Pemeta baris Prisma -> DTO R09 (`ArtifactSummary`, `OutputFileDto`).
 */
import type { StudioArtifact, StudioOutputFile } from "@prisma/client";
import type { ArtifactSummary, OutputFileDto } from "@/lib/studio/contract/types/api";
import { toOutputFileDto } from "@/lib/studio/services/storage";

export function toArtifactSummary(row: StudioArtifact): ArtifactSummary {
  return {
    id: row.id,
    kind: row.kind,
    schemaId: row.schemaId,
    title: row.title,
    label: row.label,
    specSha256: row.specSha256,
    templateVersionId: row.templateVersionId,
    missionFolder: row.missionFolder,
    agentRequestId: row.agentRequestId,
    hermesTaskId: row.hermesTaskId,
    releaseStatus: row.releaseStatus,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Kode chart artefak CHART (`spec.kind`, mis. `P-01` atau `composite`); null
 * untuk jenis lain atau spec tanpa `kind` teks (IP-11, filter galeri S62).
 */
export function chartCodeOf(row: Pick<StudioArtifact, "kind" | "spec">): string | null {
  if (row.kind !== "CHART") return null;
  const spec = row.spec;
  if (spec === null || typeof spec !== "object" || Array.isArray(spec)) return null;
  const kind = (spec as Record<string, unknown>).kind;
  return typeof kind === "string" && kind ? kind.slice(0, 40) : null;
}

/** Item daftar galeri: ringkasan + kode chart + berkas keluaran (untuk pratinjau/unduh R10). */
export type ArtifactListItem = ArtifactSummary & { chartCode: string | null; outputs: OutputFileDto[] };

export function toArtifactListItem(row: StudioArtifact & { outputs: StudioOutputFile[] }): ArtifactListItem {
  return { ...toArtifactSummary(row), chartCode: chartCodeOf(row), outputs: row.outputs.map(toOutputFileDto) };
}
