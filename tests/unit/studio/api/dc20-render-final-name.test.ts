// DC-20 (register 05 §9.5, §10; AM-09, AM-15, KD-41, CQ-2, CQ-3): setiap
// `OutputFileDto` dari pemeta bersama `toOutputFileDto` (services/storage/files.ts)
// memuat `finalFileName` (C51) bila pemilik dapat ditentukan; R17 meneruskannya
// apa adanya; `requestFormats` (services/render/scope.ts) memakai C40 (HTML) untuk
// dokumen ber-contractKind tanpa `formats`/`figures`. Prisma DI-MOCK.
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/templates', async (orig) => ({
  ...(await orig<object>()),
  resolveTemplate: vi.fn(async () => ({ slug: 'stub', versionNo: 1 })),
}));

import { callsOf, on, resetDb } from './_prisma';
import { FINAL_FILENAME_PATTERN, type OutputFileDto } from '@/lib/studio/contract';
import { finalFileNameOfRow, OUTPUT_FILE_OWNER_INCLUDE, toOutputFileDto, writeOutput, type OutputFileRow } from '@/lib/studio/services/storage';
import { prepareScopeRender } from '@/lib/studio/services/render/scope';
import { handleRenderPost, type RenderRouteDeps, type RenderScopeResult } from '@/app/api/studio/documents/[id]/render/_lib/handler';
import { reqCtx } from '@/lib/studio/http';
import { NextRequest } from 'next/server';

const C51 = new RegExp(FINAL_FILENAME_PATTERN);
const SHA = '55d324b1' + 'a'.repeat(56);
const CREATED = new Date('2026-10-30T12:58:00.400Z');
const EXAMPLE = '003-GSP-KT-X-2026_rev12_20261030T125800Z_55d324b1.html';

function baseRow(over: Partial<OutputFileRow> = {}): OutputFileRow {
  return {
    id: 'f1',
    documentId: 'doc1',
    revisionId: 'rev1',
    artifactId: null,
    renderJobId: null,
    format: 'HTML',
    role: 'PRIMARY',
    figureLabel: null,
    relPath: 'docs/x/rev-12/a.html',
    fileName: 'a.html',
    bytes: 10,
    sha256: SHA,
    mime: 'text/html; charset=utf-8',
    lintVerdict: 'PASS',
    createdAt: CREATED,
    scopeKind: 'DOCUMENT',
    scopeKey: null,
    draft: false,
    ...over,
  } as OutputFileRow;
}

beforeEach(() => resetDb());

describe('DC-20 pemeta OutputFileDto bersama (AM-09, CQ-3)', () => {
  it('baris revisi + relasi pemilik -> finalFileName = contoh register §10', () => {
    const dto = toOutputFileDto(baseRow({ document: { docNumber: '003/GSP/KT/X/2026', contractKind: null }, revision: { revisionNo: 12 } }));
    expect(dto.finalFileName).toBe(EXAMPLE);
    expect(C51.test(dto.finalFileName!)).toBe(true);
    // Relasi tidak bocor ke DTO.
    expect(dto).not.toHaveProperty('document');
    expect(dto).not.toHaveProperty('revision');
  });

  it('baris artefak tanpa relasi -> ART-<id>_rev0', () => {
    const dto = toOutputFileDto(baseRow({ documentId: null, revisionId: null, artifactId: 'ck_9', format: 'SVG', fileName: 'a.svg' }));
    expect(dto.finalFileName).toBe('ART-ck9_rev0_20261030T125800Z_55d324b1.svg');
    expect(C51.test(dto.finalFileName!)).toBe(true);
  });

  // D-389 (DC-WIRE2) menggantikan perilaku opsional lama: AM-09 kini WAJIB.
  it('baris revisi TANPA relasi dimuat -> galat pemrograman (AM-09 wajib, D-389)', () => {
    expect(() => toOutputFileDto(baseRow())).toThrow(TypeError);
    expect(() => finalFileNameOfRow(baseRow())).toThrow(/OUTPUT_FILE_OWNER_INCLUDE/);
  });

  it('writeOutput (jalur R17/R07): upsert memuat relasi pemilik, DTO membawa finalFileName C51', async () => {
    on('studioOutputFile', 'findUnique', async () => null);
    on('studioOutputFile', 'upsert', async (a: { create: Record<string, unknown> }) => ({
      id: 'f9',
      ...a.create,
      createdAt: CREATED,
      scopeKind: 'DOCUMENT',
      scopeKey: null,
      draft: false,
      document: { docNumber: '003/GSP/KT/X/2026', contractKind: 'agentWorkReport' },
      revision: { revisionNo: 12 },
    }));
    const dto = await writeOutput({
      documentId: 'doc1',
      revisionId: 'rev1',
      relDir: 'docs/dc20-test/rev-12',
      fileName: 'a.html',
      data: '<p>x</p>',
      format: 'HTML',
      role: 'PRIMARY',
      mime: 'text/html; charset=utf-8',
    });
    const upsertArgs = callsOf('studioOutputFile', 'upsert')[0][0] as { include: unknown };
    expect(upsertArgs.include).toEqual(OUTPUT_FILE_OWNER_INCLUDE);
    expect(C51.test(dto.finalFileName!)).toBe(true);
    expect(dto.finalFileName).toBe(`003-GSP-KT-X-2026_rev12_20261030T125800Z_${dto.sha256.slice(0, 8)}.html`);
  });
});

describe('DC-20 R17 meneruskan outputs[].finalFileName', () => {
  it('respons 200 memuat finalFileName per keluaran apa adanya', async () => {
    const out = { ...toOutputFileDto(baseRow({ document: { docNumber: '003/GSP/KT/X/2026' }, revision: { revisionNo: 12 } })) } as OutputFileDto;
    const result: RenderScopeResult = {
      job: { id: 'job1', status: 'SUCCEEDED', formats: ['HTML'], errors: [], scope: { kind: 'DOCUMENT' }, draft: false } as unknown as RenderScopeResult['job'],
      outputs: [out],
      completeness: { status: 'COMPLETE' } as RenderScopeResult['completeness'],
      errors: [],
    };
    const deps: RenderRouteDeps = {
      getCaller: async () => ({ requester: 'agent:test' }) as never,
      checkRate: () => null,
      assertCapacity: () => undefined,
      renderScope: async () => result,
      retryAfterSec: () => 5,
    };
    const r = new NextRequest('https://127.0.0.1:9011/api/studio/documents/doc1/render', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope: 'document' }),
    });
    const res = await handleRenderPost(r, 'doc1', reqCtx(r, '/api/studio/documents/[id]/render', 'studio.api.render'), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outputs[0].finalFileName).toBe(EXAMPLE);
    expect(C51.test(body.outputs[0].finalFileName)).toBe(true);
  });
});

describe('DC-20 requestFormats bawaan HTML untuk dokumen ber-contractKind (KD-41, AM-15, CQ-2)', () => {
  const V1_SNAPSHOT = { schema: 'studio.norm/v1', doc: { meta: {} }, blocks: [], units: [] };

  type Db = Parameters<typeof prepareScopeRender>[0];
  const asDb = (c: ReturnType<typeof client>): Db => c as unknown as Db;

  function client(contractKind: string | null) {
    return {
      studioDocument: {
        findUnique: vi.fn(async (args: { select: Record<string, unknown> }) =>
          args.select ? { id: 'doc1', docNumber: 'D-1', tier: 'T1', missionFolder: null, missionDocKey: null, currentRevisionNo: 1, contractKind } : null,
        ),
      },
      studioRevision: {
        findUnique: vi.fn(async () => ({
          id: 'rev1',
          documentId: 'doc1',
          revisionNo: 1,
          docRev: '00',
          snapshot: V1_SNAPSHOT,
          completeness: 'COMPLETE',
          completenessReport: null,
          templateVersionId: 'tv1',
          templateVersion: { id: 'tv1', versionNo: 1, template: { slug: 'stub' } },
        })),
      },
    };
  }

  it('ber-contractKind tanpa formats/figures -> ["HTML"]', async () => {
    const c = client('agentWorkReport');
    const plan = await prepareScopeRender(asDb(c), 'doc1', { scope: 'document' });
    expect(plan.formats).toEqual(['HTML']);
    expect(c.studioDocument.findUnique.mock.calls[0][0].select.contractKind).toBe(true);
  });

  it('ber-contractKind dengan formats eksplisit -> formats eksplisit dipakai', async () => {
    const plan = await prepareScopeRender(asDb(client('agentWorkReport')), 'doc1', { scope: 'document', formats: ['docx'] });
    expect(plan.formats).toEqual(['DOCX']);
  });

  it('ber-contractKind dengan figures saja -> figures dipakai (bukan bawaan HTML)', async () => {
    const plan = await prepareScopeRender(asDb(client('agentWorkReport')), 'doc1', { scope: 'document', figures: ['svg'] });
    expect(plan.formats).toEqual(['SVG']);
  });

  it('dokumen biasa tanpa formats -> kosong (bawaan snapshot/orkestrator tidak berubah)', async () => {
    const plan = await prepareScopeRender(asDb(client(null)), 'doc1', { scope: 'document' });
    expect(plan.formats).toEqual([]);
  });
});
