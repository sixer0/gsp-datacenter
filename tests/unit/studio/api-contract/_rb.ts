/* eslint-disable @typescript-eslint/no-explicit-any -- uji: proksi klien Prisma dinamis */
// DC-36: harness DB transaksi-ROLLBACK untuk handler route NYATA.
//
// Berkas uji memetakan `@/lib/prisma` ke `prismaProxy`:
//   vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));
// `openRollback()` membuka SATU transaksi interaktif pada klien nyata (`gsp_agent_hq_v21`)
// yang ditahan terbuka sampai `close()`, lalu SELALU di-ROLLBACK (galat penanda). Selama
// terbuka, setiap akses `prisma.<model>` / `$queryRaw` / `$executeRaw` handler + layanan
// diteruskan ke klien transaksi tersebut. `prisma.$transaction(fn)` milik layanan dijalankan
// sebagai SAVEPOINT bertingkat (galat -> ROLLBACK TO SAVEPOINT, setara semantik transaksi
// layanan yang gagal); transaksi layanan READ ONLY (dry-run R08/R23, `SET TRANSACTION READ
// ONLY`) dikembalikan ke SAVEPOINT agar transaksi luar tetap baca-tulis. Di luar jendela
// rollback, proksi MENOLAK setiap akses DB (tidak ada tulis yang mungkin ter-commit).
// Batas: kunci advisory `pg_advisory_xact_lock` dipegang sampai rollback (kunci per dokumen
// uji, tidak bentrok dengan dokumen lain).
import { PrismaClient } from '@prisma/client';

export const EXPECTED_DB = 'gsp_agent_hq_v21';
const ROLLBACK = new Error('DC36_ROLLBACK');

let realClient: PrismaClient | null = null;
export function real(): PrismaClient {
  realClient ??= new PrismaClient();
  return realClient;
}

let current: any = null;
let spSeq = 0;
/** Jumlah transaksi layanan (SAVEPOINT) yang dijalankan; dipakai uji sebagai bukti jalur. */
export const stats = { savepoints: 0, rolledBackSavepoints: 0, readOnlySavepoints: 0 };

async function nested(fn: (tx: any) => Promise<unknown>): Promise<unknown> {
  const tx = current;
  const name = `dc36_sp_${++spSeq}`;
  stats.savepoints += 1;
  await tx.$executeRawUnsafe(`SAVEPOINT ${name}`);
  try {
    const out = await fn(tx);
    const ro = await tx.$queryRawUnsafe(`select current_setting('transaction_read_only') as v`);
    if (ro[0]?.v === 'on') {
      stats.readOnlySavepoints += 1;
      await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${name}`);
    }
    await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${name}`);
    return out;
  } catch (e) {
    stats.rolledBackSavepoints += 1;
    await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${name}`);
    await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${name}`);
    throw e;
  }
}

function outside(prop: PropertyKey): never {
  throw new Error(`DC-36: akses DB di luar transaksi ROLLBACK ditolak (prisma.${String(prop)})`);
}

export const prismaProxy: any = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === 'then') return undefined;
      if (prop === '$connect' || prop === '$disconnect') return async () => undefined;
      if (prop === '$transaction') {
        return async (arg: any) => {
          if (!current) outside(prop);
          if (typeof arg === 'function') return nested(arg);
          const out: unknown[] = [];
          for (const p of arg as Promise<unknown>[]) out.push(await p);
          return out;
        };
      }
      if (!current) outside(prop);
      const v = current[prop];
      return typeof v === 'function' ? v.bind(current) : v;
    },
  },
);

/** Klien transaksi aktif (untuk baca/tulis fixture langsung dari uji). */
export function tx(): any {
  if (!current) throw new Error('DC-36: tidak ada transaksi ROLLBACK aktif');
  return current;
}

export interface RollbackWindow {
  /** Tutup jendela: transaksi di-ROLLBACK; galat selain penanda dilempar ulang. */
  close(): Promise<void>;
}

export async function assertExpectedDb(): Promise<string> {
  const rows = await real().$queryRawUnsafe<Array<{ d: string }>>('select current_database() as d');
  const d = rows[0]?.d ?? '';
  if (d !== EXPECTED_DB) throw new Error(`DC-36 menolak berjalan: current_database() = ${d}, harus ${EXPECTED_DB}`);
  return d;
}

export async function openRollback(timeoutMs = 600_000): Promise<RollbackWindow> {
  await assertExpectedDb();
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  let ready!: () => void;
  const opened = new Promise<void>((r) => {
    ready = r;
  });
  const done = real()
    .$transaction(
      async (t) => {
        current = t;
        ready();
        await gate;
        current = null;
        throw ROLLBACK;
      },
      { timeout: timeoutMs, maxWait: 20_000 },
    )
    .then(
      () => {
        throw new Error('DC-36: transaksi tidak di-rollback');
      },
      (e) => {
        current = null;
        if (e !== ROLLBACK) throw e;
      },
    );
  await Promise.race([opened, done]);
  if (!current) {
    await done;
    throw new Error('DC-36: transaksi ROLLBACK gagal dibuka');
  }
  return {
    async close() {
      release();
      await done;
    },
  };
}

/** Tabel yang dihitung sebelum/sesudah (hitungan global; informatif bila agen lain menulis DEV). */
export const COUNTED_TABLES = [
  'StudioDocument',
  'StudioRevision',
  'StudioDocBlock',
  'StudioContractRecord',
  'StudioContractItem',
  'StudioDocRef',
  'StudioOutputFile',
  'StudioTemplateVersion',
] as const;

export async function globalCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of COUNTED_TABLES) {
    const r = await real().$queryRawUnsafe<Array<{ n: bigint }>>(`select count(*)::bigint as n from "${t}"`);
    out[t] = Number(r[0]?.n ?? 0);
  }
  return out;
}

/** Sisa fixture run ini SESUDAH rollback (klien nyata, bukan transaksi). */
export async function residue(o: { docIds: string[]; missionPrefix: string; runId: string; templateVersionIds?: string[]; fileIds?: string[] }): Promise<Record<string, number>> {
  const p = real();
  const docIds = [...new Set(o.docIds)];
  return {
    documents: await p.studioDocument.count({ where: { OR: [{ id: { in: docIds } }, { missionFolder: { startsWith: o.missionPrefix } }, { createdBy: { contains: o.runId } }] } }),
    revisions: await p.studioRevision.count({ where: { OR: [{ documentId: { in: docIds } }, { createdBy: { contains: o.runId } }] } }),
    contractRecords: await p.studioContractRecord.count({ where: { documentId: { in: docIds } } }),
    contractItems: await p.studioContractItem.count({ where: { documentId: { in: docIds } } }),
    docRefs: await p.studioDocRef.count({ where: { fromDocumentId: { in: docIds } } }),
    outputFiles: await p.studioOutputFile.count({ where: { OR: [{ documentId: { in: docIds } }, { id: { in: o.fileIds ?? [] } }] } }),
    templateVersions: await p.studioTemplateVersion.count({ where: { OR: [{ id: { in: o.templateVersionIds ?? [] } }, { createdBy: { contains: o.runId } }] } }),
  };
}

export async function disconnectReal(): Promise<void> {
  await realClient?.$disconnect();
  realClient = null;
}
