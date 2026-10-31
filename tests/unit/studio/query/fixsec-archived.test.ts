/* eslint-disable @typescript-eslint/no-explicit-any -- uji: klien transaksi Prisma */
// FIX-SEC M-1 (D-402; security DC-41) — dokumen terarsip DIKECUALIKAN secara bawaan dari
// I65 `queryContracts` / I66 `searchBlocks`; `includeArchived: true` menyertakannya.
// Bagian 1 murni (filter Prisma / SQL terparameter). Bagian 2 DB NYATA `gsp_agent_hq_v21`
// (pola fixqb/SR-45): seluruh kerja di SATU transaksi yang selalu di-ROLLBACK (galat penanda);
// sisa 0 baris diperiksa sesudahnya. URL DB tidak pernah dicetak.
import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { contractWhere, queryContracts } from '@/lib/studio/services/query/contracts';
import { searchBlocks, searchConditions } from '@/lib/studio/services/query/search';
import { contractFilterIssues, searchFilterIssues } from '@/lib/studio/services/query/filters';

const EXPECTED_DB = 'gsp_agent_hq_v21';
const RUN = `fxsec${process.pid}${Date.now().toString(36)}`;
const ROLLBACK = new Error('FIXSEC_ROLLBACK');

describe('FIX-SEC arsip bawaan dikecualikan (murni)', () => {
  it('contractWhere: archived=false bawaan; includeArchived -> tanpa syarat archived', () => {
    expect(contractWhere({}).archived).toBe(false);
    expect(contractWhere({ includeArchived: true })).not.toHaveProperty('archived');
  });

  it('searchConditions: d."archived" = false literal (tanpa parameter baru); opt-in -> tidak ada', () => {
    const def = Prisma.join(searchConditions({ q: 'ab' }), ' AND ');
    expect(def.sql).toContain('d."archived" = false');
    expect(def.values).toEqual([]);
    const opt = Prisma.join(searchConditions({ q: 'ab', includeArchived: true }), ' AND ');
    expect(opt.sql).not.toContain('archived');
  });

  it('pengaman filter bertipe: includeArchived hanya true; NUL ditolak', () => {
    expect(contractFilterIssues({ includeArchived: false as never })[0]?.pointer).toBe('/query/includeArchived');
    expect(searchFilterIssues({ q: 'ab', includeArchived: 1 as never })[0]?.pointer).toBe('/query/includeArchived');
    expect(contractFilterIssues({ docNumber: 'a\u0000b' })).toEqual([expect.objectContaining({ pointer: '/query/docNumber', keyword: 'pattern' })]);
    expect(searchFilterIssues({ q: 'ab\u0000' })).toEqual([expect.objectContaining({ pointer: '/query/q', keyword: 'pattern' })]);
  });
});

describe('FIX-SEC arsip (DB v21, transaksi ROLLBACK)', () => {
  it('queryContracts (mission + docNumber) dan searchBlocks: arsip hilang tanpa opt-in, muncul dengan opt-in; 0 baris tersisa', async () => {
    const db = await prisma.$queryRawUnsafe<Array<{ d: string }>>('select current_database() as d');
    expect(db[0]?.d).toBe(EXPECTED_DB);

    const out: Record<string, unknown> = {};
    const insertedIds: string[] = [];
    try {
      await prisma.$transaction(
        async (tx) => {
          const tpl = await tx.studioTemplate.findFirst({ select: { id: true } });
          if (!tpl) throw new Error('tidak ada templat di DB v21 untuk fixture');
          const mk = async (i: number, archived: boolean) => {
            const d = await tx.studioDocument.create({
              data: {
                docNumber: `${RUN}-${i}`,
                numberSource: 'AGENT',
                title: `fixsec ${RUN} ${i}`,
                typeCode: 'X',
                classification: 'B',
                tier: 'NOTA',
                templateId: tpl.id,
                createdBy: `fixsec:${RUN}`,
                contractKind: 'agentWorkReport',
                missionFolder: RUN,
                archived,
              },
              select: { id: true },
            });
            insertedIds.push(d.id);
            return d.id;
          };
          const live = await mk(0, false);
          const arch = await mk(1, true);
          const opts = { db: tx as any, correlationId: `fixsec-${RUN}` };
          const ids = (r: { contracts: Array<{ documentId: string }> }) => r.contracts.map((c) => c.documentId).sort();
          out.missionDefault = ids(await queryContracts({ mission: RUN }, opts));
          out.missionOptIn = ids(await queryContracts({ mission: RUN, includeArchived: true }, opts));
          out.docNumberDefault = ids(await queryContracts({ docNumber: `${RUN}-1` }, opts));
          out.docNumberOptIn = ids(await queryContracts({ docNumber: `${RUN}-1`, includeArchived: true }, opts));
          out.expect = { live, arch };

          // searchBlocks: cari kata yang punya hit di revisi terkini, arsipkan dokumen hit pertama
          // di DALAM transaksi, lalu bandingkan bawaan vs opt-in.
          let probe: { q: string; doc: string } | null = null;
          for (const q of ['laporan', 'dokumen', 'agen', 'kerja', 'the']) {
            const r = await searchBlocks({ q, take: 50 }, opts);
            if (r.hits.length > 0) {
              probe = { q, doc: r.hits[0].documentId };
              break;
            }
          }
          if (probe) {
            await tx.studioDocument.update({ where: { id: probe.doc }, data: { archived: true } });
            const def = await searchBlocks({ q: probe.q, documentId: probe.doc, take: 50 }, opts);
            const opt = await searchBlocks({ q: probe.q, documentId: probe.doc, take: 50, includeArchived: true }, opts);
            out.search = { defaultHits: def.hits.length, optInHits: opt.hits.length };
          } else {
            out.search = null;
          }
          throw ROLLBACK;
        },
        { timeout: 60_000, maxWait: 10_000 },
      );
    } catch (e) {
      if (e !== ROLLBACK) throw e;
    }

    const { live, arch } = out.expect as { live: string; arch: string };
    expect(out.missionDefault).toEqual([live]);
    expect(out.missionOptIn).toEqual([live, arch].sort());
    expect(out.docNumberDefault).toEqual([]);
    expect(out.docNumberOptIn).toEqual([arch]);
    if (out.search !== null) {
      const s = out.search as { defaultHits: number; optInHits: number };
      expect(s.defaultHits).toBe(0);
      expect(s.optInHits).toBeGreaterThan(0);
    }
    expect(await prisma.studioDocument.count({ where: { OR: [{ createdBy: `fixsec:${RUN}` }, { id: { in: insertedIds } }] } })).toBe(0);
  }, 120_000);
});
