/**
 * Klien DB layanan retrieval (DC-14): bawaan `prisma` global; pemanggil boleh
 * menyuntik klien transaksi (asap transaksi-rollback, transaksi READ ONLY).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newQueryCorrelationId } from "./log";

/** Klien yang cukup untuk kueri baca (PrismaClient atau klien transaksi). */
export type QueryDb = Prisma.TransactionClient;

export interface QueryOptions {
  db?: QueryDb;
  /** Correlation id permintaan (route: `ctx.correlationId`); dibangkitkan bila kosong. */
  correlationId?: string;
}

export function resolveQueryOptions(o: QueryOptions | undefined): { db: QueryDb; correlationId: string } {
  return { db: o?.db ?? prisma, correlationId: o?.correlationId ?? newQueryCorrelationId() };
}
