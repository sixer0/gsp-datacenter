/* eslint-disable @typescript-eslint/no-explicit-any -- uji: klien transaksi Prisma */
// FIX-QB / FIX-R40-4 (review DC-40 #4; register 05 §10 FN-02 I61, C52, §9.1 R21 `docNumber`):
// replika SQL `docNumberSafe` di `queryContracts` memakai C52 `FINAL_DOC_NUMBER_MAX` sebagai
// PARAMETER (bukan angka keras) dan setara dengan versi TS untuk >= 10 fixture.
// DB NYATA `gsp_agent_hq_v21` (pola SR-45): seluruh kerja di SATU transaksi yang selalu
// di-ROLLBACK (galat penanda); tabel sementara + dokumen fixture tidak pernah ter-commit;
// sisa 0 baris diperiksa sesudahnya. URL DB tidak pernah dicetak.
import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { FINAL_DOC_NUMBER_MAX } from '@/lib/studio/contract/env';
import { docNumberSafeSql, queryContracts } from '@/lib/studio/services/query/contracts';
import { docNumberSafe } from '@/lib/studio/services/render/final-name';

const EXPECTED_DB = 'gsp_agent_hq_v21';
const RUN = `fxqb${process.pid}${Date.now().toString(36)}`;
const ROLLBACK = new Error('FIXQB_ROLLBACK');

/** Fixture I61 (langkah 1-5): garis miring, spasi, unicode, titik/strip tepi, runtun, > C52, kosong. */
const FIXTURES = [
  '001/GSP/KT/X/2026',
  'ND-12 / GSP / X / 2026',
  '..--abc--..',
  'a//b\\\\c  d',
  'Laporan Énergie №7',
  '---',
  '',
  '...',
  'A.B-C.D',
  'x'.repeat(79) + '-y',
  'x'.repeat(79) + '.' + 'z'.repeat(10),
  'K'.repeat(120),
  '😀 emoji 😀/2026',
  'tab\there\nbaris',
];

describe('FIX-R40-4 SQL docNumberSafe terparameter (tanpa DB)', () => {
  it('C52 dikirim sebagai parameter ::int, bukan literal di teks SQL', () => {
    const frag = docNumberSafeSql(Prisma.sql`"docNumber"`);
    expect(frag.sql).toContain('::int');
    expect(frag.sql).not.toMatch(/\b80\b/);
    expect(frag.values).toEqual([FINAL_DOC_NUMBER_MAX]);
  });
});

describe('FIX-R40-4 paritas SQL = docNumberSafe (DB v21, transaksi ROLLBACK)', () => {
  it(`${FIXTURES.length} fixture: nilai SQL = TS; queryContracts menemukan dokumen lewat bentuk aman; 0 baris tersisa`, async () => {
    const db = await prisma.$queryRawUnsafe<Array<{ d: string }>>('select current_database() as d');
    expect(db[0]?.d).toBe(EXPECTED_DB);

    const parity: Array<{ input: string; sql: string; ts: string }> = [];
    const found: Array<{ docNumber: string; safe: string; hit: boolean }> = [];
    const insertedIds: string[] = [];
    try {
      await prisma.$transaction(
        async (tx) => {
          // (a) ekspresi atas kolom teks tabel sementara (sama dengan kolom "docNumber").
          await tx.$executeRawUnsafe('CREATE TEMP TABLE fixqb_docnum (i int, v text) ON COMMIT DROP');
          for (const [i, v] of FIXTURES.entries()) await tx.$executeRaw`INSERT INTO fixqb_docnum (i, v) VALUES (${i}, ${v})`;
          const rows = await tx.$queryRaw<Array<{ i: number; s: string }>>`SELECT i, ${docNumberSafeSql(Prisma.sql`v`)} AS s FROM fixqb_docnum ORDER BY i`;
          for (const r of rows) parity.push({ input: FIXTURES[r.i], sql: r.s, ts: docNumberSafe(FIXTURES[r.i]) });

          // (b) jalur nyata `queryContracts` (filter docNumber) atas dokumen fixture ber-contractKind.
          const tpl = await tx.studioTemplate.findFirst({ select: { id: true } });
          if (!tpl) throw new Error('tidak ada templat di DB v21 untuk fixture');
          for (const [i, v] of FIXTURES.slice(0, 10).entries()) {
            const docNumber = `${RUN}-${i}/${v}`;
            const d = await tx.studioDocument.create({
              data: {
                docNumber,
                numberSource: 'AGENT',
                title: `fixqb ${RUN} ${i}`,
                typeCode: 'X',
                classification: 'B',
                tier: 'NOTA',
                templateId: tpl.id,
                createdBy: `fixqb:${RUN}`,
                contractKind: 'agentWorkReport',
              },
              select: { id: true },
            });
            insertedIds.push(d.id);
            const safe = docNumberSafe(docNumber);
            const r = await queryContracts({ docNumber: safe, take: 50 }, { db: tx as any, correlationId: `fixqb-${RUN}` });
            found.push({ docNumber, safe, hit: r.contracts.some((c) => c.documentId === d.id) });
          }
          throw ROLLBACK;
        },
        { timeout: 60_000, maxWait: 10_000 },
      );
    } catch (e) {
      if (e !== ROLLBACK) throw e;
    }

    expect(parity).toHaveLength(FIXTURES.length);
    expect(parity.filter((p) => p.sql !== p.ts)).toEqual([]);
    expect(found).toHaveLength(10);
    expect(found.filter((f) => !f.hit)).toEqual([]);
    // Sisa: dokumen fixture (rollback) dan tabel sementara (ON COMMIT DROP + rollback).
    expect(await prisma.studioDocument.count({ where: { OR: [{ createdBy: `fixqb:${RUN}` }, { id: { in: insertedIds } }] } })).toBe(0);
    const temp = await prisma.$queryRawUnsafe<Array<{ n: number }>>("select count(*)::int as n from pg_class where relname = 'fixqb_docnum'");
    expect(temp[0]?.n).toBe(0);
  }, 120_000);
});
