/**
 * `ContractRefReader` berbasis Prisma (DC-07; BACA SAJA): `StudioDocument`
 * (id, docNumber, currentRevisionNo) dan `StudioDocIdentity` (pid pernah ada,
 * `retiredRevisionNo`). Klien boleh disuntik (klien transaksi langkah 9a / R08
 * READ ONLY); bawaan `prisma` global. Dipisah dari barrel agar modul murni
 * tidak memuat klien DB.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logContractsError, newContractsCorrelationId } from "./log";
import type { ContractRefReader, ContractRefTargetDoc, ContractRefTargetIdentity } from "./refs";

export interface PrismaContractRefReaderOptions {
  db?: Prisma.TransactionClient;
  correlationId?: string;
}

const DOC_SELECT = { id: true, docNumber: true, currentRevisionNo: true } as const;

export function createPrismaContractRefReader(opts: PrismaContractRefReaderOptions = {}): ContractRefReader {
  const db = opts.db ?? prisma;
  const correlationId = opts.correlationId ?? newContractsCorrelationId();

  async function guarded<T>(op: string, count: number, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (err) {
      logContractsError(correlationId, `contract ref reader ${op} failed`, err, { op, count });
      throw err;
    }
  }

  return {
    documentsByIds(ids): Promise<ContractRefTargetDoc[]> {
      return guarded("documentsByIds", ids.length, () => db.studioDocument.findMany({ where: { id: { in: [...ids] } }, select: DOC_SELECT }));
    },
    documentsByNumbers(docNumbers): Promise<ContractRefTargetDoc[]> {
      return guarded("documentsByNumbers", docNumbers.length, () =>
        db.studioDocument.findMany({ where: { docNumber: { in: [...docNumbers] } }, select: DOC_SELECT }),
      );
    },
    identities(keys): Promise<ContractRefTargetIdentity[]> {
      const byDoc = new Map<string, Set<string>>();
      for (const k of keys) {
        const set = byDoc.get(k.documentId) ?? new Set<string>();
        set.add(k.pid);
        byDoc.set(k.documentId, set);
      }
      const or = [...byDoc].map(([documentId, pids]) => ({ documentId, pid: { in: [...pids] } }));
      return guarded("identities", keys.length, () =>
        db.studioDocIdentity.findMany({ where: { OR: or }, select: { documentId: true, pid: true, retiredRevisionNo: true } }),
      );
    },
  };
}
