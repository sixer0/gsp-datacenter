/**
 * FIG-03b — muat revisi + templat tersemat untuk pratinjau figur (BACA SAJA: dua findUnique + resolusi
 * templat, sama dengan `prepareScopeRender` layanan render; tanpa job, tanpa tulis).
 */
import { prisma } from "@/lib/prisma";
import type { AnyNormSnapshot, ResolvedTemplate } from "@/lib/studio/contract";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import { asAnySnapshot } from "@/lib/studio/services/render/common";

export interface FigureContext {
  documentId: string;
  revisionNo: number;
  currentRevisionNo: number;
  snapshot: AnyNormSnapshot;
  template: ResolvedTemplate;
}

export async function loadFigureContext(documentId: string, revisionNo: number | undefined): Promise<FigureContext> {
  const doc = await prisma.studioDocument.findUnique({ where: { id: documentId }, select: { id: true, currentRevisionNo: true } });
  if (!doc) throw new StudioEngineError("DOCUMENT_NOT_FOUND", `document ${documentId} not found`, { documentId });
  const no = revisionNo ?? doc.currentRevisionNo;
  const rev = await prisma.studioRevision.findUnique({
    where: { documentId_revisionNo: { documentId: doc.id, revisionNo: no } },
    select: { revisionNo: true, snapshot: true, templateVersion: { select: { versionNo: true, template: { select: { slug: true } } } } },
  });
  if (!rev) throw new StudioEngineError("REVISION_NOT_FOUND", `revision ${no} of document ${doc.id} not found`, { documentId: doc.id, revisionNo: no });
  const { resolveTemplate } = await import("@/lib/studio/services/templates");
  const template = await resolveTemplate(rev.templateVersion.template.slug, rev.templateVersion.versionNo);
  return { documentId: doc.id, revisionNo: rev.revisionNo, currentRevisionNo: doc.currentRevisionNo, snapshot: asAnySnapshot(rev.snapshot), template };
}
